/*****************************************************************************************
// Starter Web Interface 8.0.2.BETA.2
// Copyright (c) 2024 Pharos Controls Ltd. All rights reserved.
//
// This sample content is made freely available for illustrative purposes only.
// Pharos Controls Ltd grants a non-exclusive copyright license to use this sample
// content from which you can generate content tailored to your own specific needs for use
// with products from Pharos Controls Ltd. This sample content has not been
// thoroughly tested under all conditions and Pharos Controls Ltd
// cannot guarantee reliability or serviceability.
//
// This sample content is provided "as is" without warranties of any kind.
// The implied warranties of non-infringement, merchantability and fitness for a particular
// purpose are expressly disclaimed. In no event shall Pharos Controls Ltd be liable
// to any party for direct, indirect, incidental or consequential damages arising from the use of
// this sample content.
//
// For further information please contact support@pharoscontrols.com.
//
// This is a local copy of the Controller Query.js file, to allow functionality tweaks.
//
//*****************************************************************************************/

// global variables
const DMX = 1;
const PATHPORT = 2;
const ARTNET = 4;
const KINET = 8;
const SACN = 16;
const DVI = 32;
const RIO_DMX = 64;
const EDN = 128;

const RIO80 = 101;
const RIO44 = 102;
const RIO08 = 103;
const EDN20 = 109;
const EDN10 = 110;

function identity(x)
{
    return x;
}

// Query object
var Query = (function ()
{

    "use strict";

    var keepAlive = false,
        replyReceived = false,
        queryString = "",
        socket = null,
        serverSessionKey = null,
        reconnectAttempts = 0,
        subscribedTopics = [],
        pendingMessages = [],
        requestCallbacks = {},
        broadcastCallbacks = {},
        requestId = 0,
        successEvent = new Event("query_success"),
        errorEvent = new Event("query_error"),
        restartEvent = new Event("query_restart"),
        handlers = {},
        onRedirect = identity;

    function setHandler(event, handler)
    {
        document.removeEventListener(event, handlers[event]);
        document.addEventListener(event, handler);
        handlers[event] = handler;
    }

    function connectSocket()
    {
        // Do not attempt to connect if we already have a socket
        if(socket)
            return;

        var pathname = (location.protocol === "http:" ? "ws:" : "wss:") + "//" + location.host + "/query" + queryString;

        socket = new WebSocket(pathname);

        socket.binaryType = "arraybuffer";

        socket.onopen = function ()
        {
            document.dispatchEvent(successEvent);

            reconnectAttempts = 0;
            while (pendingMessages.length)
            {
                socket.send(pendingMessages[0]);
                pendingMessages.shift();
            }

            subscribedTopics.forEach( (value) => {
                sendMessage({ 'subscribe' : value });
            });
            keepAlive = true;
            replyReceived = true;
            webSocketKeepAlive();
        };

        socket.onmessage = function (ev)
        {
            var data = ev.data;
            replyReceived = true;
            if (typeof data === "object")
            {
                var array = new Int32Array(data);
                if (serverSessionKey)
                {
                    // need to compare primitives as two objects are never the same
                    if ((serverSessionKey[0] != array[0]) ||
                        (serverSessionKey[1] != array[1]) ||
                        (serverSessionKey[2] != array[2]) ||
                        (serverSessionKey[3] != array[3]))
                    {
                        document.dispatchEvent(restartEvent);
                        serverSessionKey = array;
                    }
                }
                else
                {
                    serverSessionKey = array;
                }
            }
            else
            {
                var json = JSON.parse(ev.data);
                onMessage(json);
            }
        };

        socket.onerror = handleWebsocketError;
    }

    function disconnectSocket()
    {
        if(socket)
        {
            socket.close();
            socket = null;
        }
        keepAlive = false;
    }

    function setAuthCookie(json) {
        if (json.token) {
            document.cookie = "token=" + json.token + "; Path=/; max-age=300";
        }
    }

    function getAuthCookie()
    {
        var match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
        if (match) return match[2];
    }

    function sendMessage(json)
    {
        const token = getAuthCookie();
        if (token)
        {
            json["token"] = token;
        }
        const msg = JSON.stringify(json);

        if (socket && socket.readyState === socket.OPEN)
        {
            socket.send(msg);
        }
        else
        {
            pendingMessages.push(msg);

            if (!socket || socket.readyState !== socket.CONNECTING)
            {
                connectSocket();
            }
        }
    }

    function webSocketKeepAlive()
    {
        // send a zero length message as a ping to keep the connection alive
        if (keepAlive)
        {
            if (replyReceived)
            {
                sendMessage({});
                setTimeout(webSocketKeepAlive, 10000);
                replyReceived = false;
            }
            else
            {
                // never got a reply, throw an error
                handleWebsocketError();
            }
        }
    }

    function reconnect()
    {
        // try to reconnect
        connectSocket();
        reconnectAttempts++;
    }

    function onMessage(json)
    {
        if (json.broadcast)
        {
            broadcastCallbacks[json.broadcast](json.data);
        }
        else if (json.request)
        {
            requestCallbacks[json.id](json.data);
        }
        else if (json.redirect)
        {
            // redirect to the login page
            window.location.href = onRedirect(json.redirect);
        }

        setAuthCookie(json);
    }

    function handleWebsocketError()
    {
        keepAlive = false;
        socket = null;

        if (reconnectAttempts === 0)
        {
            document.dispatchEvent(errorEvent);
        }

        if (reconnectAttempts < 10)
        {
            setTimeout(reconnect, reconnectAttempts * 1000);
        }
    }

    function nextRequestId()
    {
        // Only needs to be unique among pending requests
        requestId = ++requestId % Number.MAX_SAFE_INTEGER;
        return requestId;
    }

    function request(string, callback, params)
    {
        var id = nextRequestId();
        requestCallbacks[id] = callback;
        sendMessage(Object.assign({ request: string, id }, params));
    }

    function subscribe(string, callback)
    {
        if(subscribedTopics.indexOf(string) == -1) {
            subscribedTopics.push(string);
        }
        broadcastCallbacks[string] = callback;
        sendMessage({ subscribe: string });
    }

    function command(method, url, data, format, callback)
    {
        var xhr = new XMLHttpRequest();

        url += queryString;

        xhr.open(method, url, true);

        // indicates that the request was via ajax, used by most web toolkits
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        if (format == "json")
        {
            xhr.setRequestHeader("Content-Type", "application/json");
            data = JSON.stringify(data);
        }

        xhr.onload = function ()
        {
            document.dispatchEvent(successEvent);

            var body = xhr.response;
            if (!body)
            {
                if (callback)
                {
                    callback();
                }
                return;
            }

            var responseType = xhr.getResponseHeader("Content-Type");

            if (responseType === "application/json")
            {
                body = JSON.parse(body);

                if (body.redirect)
                {
                    // redirect to the login page
                    window.location.href = onRedirect(body.redirect);
                }

                setAuthCookie(body);
            }

            if (callback)
            {
                callback(body, xhr.status);
            }
        };

        xhr.onerror = function() { document.dispatchEvent(errorEvent); };

        xhr.send(data);
    }

    return {
        connect () { connectSocket(); },
        disconnect : function () { disconnectSocket(); },

        get_system_info (callback)           { request("system", callback); },
        get_project_info (callback)           { request("project", callback); },
        get_current_time (callback)           { request("current_time", callback); },

        get_timeline_info (callback, params)   { request("timeline", callback, params); },
        get_scene_info (callback, params)   { request("scene", callback, params); },
        get_group_info (callback, params)   { request("group", callback, params); },
        get_trigger_info (callback, params)   { request("trigger", callback, params); },
        get_content_target_info (callback)           { request("content_target", callback); },
        get_controller_info (callback)           { request("controller", callback); },
        get_remote_device_info (callback)           { request("remote_device", callback); },

        get_temperature (callback)           { request("temperature", callback); },
        get_fan_speed (callback)           { request("fan_speed", callback); },
        get_text_slot (callback, params)   { request("text_slot", callback, params); },
        get_protocols (callback)           { request("protocol", callback); },
        get_output (key, callback)      { request("output", callback, { universe: key }); },
        get_lua_variables (vars, callback)     { request("lua", callback, { variables: vars }); },
        get_replication (callback)           { request("replication", callback); },
        get_io_module_info (callback)           { request("io_module", callback); },
        get_config (callback)           { request("config", callback); },

        subscribe_timeline_status (callback)         { subscribe("timeline", callback); },
        subscribe_scene_status (callback)           { subscribe("scene", callback); },
        subscribe_group_status (callback)           { subscribe("group", callback); },
        subscribe_content_target_status (callback)   { subscribe("content_target", callback); },
        subscribe_remote_device_status (callback)    { subscribe("remote_device", callback); },
        subscribe_beacon (callback)           { subscribe("beacon", callback); },
        subscribe_lua (callback)           { subscribe("lua", callback); },
        subscribe_io_modules (callback)           { subscribe("io_module", callback); },
        subscribe_rdm_discovery (callback)           { subscribe("rdm_discovery", callback); },
        subscribe_rdm_get_set (callback)           { subscribe("rdm_get_set", callback); },
        subscribe_tag_set (callback)           { subscribe("tag_set", callback); },
        subscribe_schedule (callback)           { subscribe("schedule", callback); },
        subscribe_ping (callback)           { subscribe("ping", callback); },

        edit_config (params = {}, callback)  { command("POST", "/api/config", params, "json", callback); },
        start_timeline (params = {}, callback)  { params.action = "start"; command("POST", "/api/timeline", params, "json", callback); },
        start_timeline_release_others (params = {}, callback)    { params.action = "start_release_others"; command("POST", "/api/timeline", params, "json", callback); },
        start_scene (params = {}, callback)  { params.action = "start"; command("POST", "/api/scene", params, "json", callback); },
        start_scene_release_others (params = {}, callback)       { params.action = "start_release_others"; command("POST", "/api/scene", params, "json", callback); },
        release_timeline (params = {}, callback)  { params.action = "release"; command("POST", "/api/timeline", params, "json", callback); },
        release_scene (params = {}, callback)  { params.action = "release"; command("POST", "/api/scene", params, "json", callback); },
        toggle_timeline (params = {}, callback)  { params.action = "toggle"; command("POST", "/api/timeline", params, "json", callback); },
        toggle_scene (params = {}, callback)  { params.action = "toggle"; command("POST", "/api/scene", params, "json", callback); },
        pause_timeline (params = {}, callback)  { params.action = "pause"; command("POST", "/api/timeline", params, "json", callback); },
        resume_timeline (params = {}, callback)  { params.action = "resume"; command("POST", "/api/timeline", params, "json", callback); },
        pause_all (callback)               { command("POST", "/api/timeline", { action: "pause" }, "json", callback); },
        resume_all (callback)               { command("POST", "/api/timeline", { action: "resume" }, "json", callback); },
        release_all_timelines (params = {}, callback)  { params.action = "release"; delete params.num; command("POST", "/api/timeline", params, "json", callback); },
        release_all_scenes (params = {}, callback)  { params.action = "release"; delete params.num; command("POST", "/api/scene", params, "json", callback); },
        release_all (params = {}, callback)  { command("POST", "/api/release_all", params, "json", callback); },
        set_timeline_rate (params = {}, callback)  { params.action = "set_rate"; command("POST", "/api/timeline", params, "json", callback); },
        set_timeline_position (params = {}, callback)  { params.action = "set_position"; command("POST", "/api/timeline", params, "json", callback); },
        fire_trigger (params = {}, callback)  { command("POST", "/api/trigger", params, "json", callback); },
        run_command (params = {}, callback)  { command("POST", "/api/cmdline", params, "json", callback); },
        master_intensity (params = {}, callback)  { params.action = "master_intensity"; command("POST", "/api/group", params, "json", callback); },
        master_content_target_intensity (params = {}, callback) { params.action = "master_intensity"; command("POST", "/api/content_target", params, "json", callback); },
        set_group_override (params = {}, callback)  { params.target = "group"; command("PUT", "/api/override", params, "json", callback); },
        set_fixture_override (params = {}, callback)  { params.target = "fixture"; command("PUT", "/api/override", params, "json", callback); },
        clear_group_overrides (params = {}, callback)  { params.target = "group"; command("DELETE", "/api/override", params, "json", callback); },
        clear_fixture_overrides (params = {}, callback)  { params.target = "fixture"; command("DELETE", "/api/override", params, "json", callback); },
        clear_all_overrides (params = {}, callback)  { delete params.num; command("DELETE", "/api/override", params, "json", callback); },
        enable_output (params = {}, callback)  { params.action = "enable"; command("POST", "/api/output", params, "json", callback); },
        disable_output (params = {}, callback)  { params.action = "disable"; command("POST", "/api/output", params, "json", callback); },
        set_text_slot (params = {}, callback)  { command("PUT", "/api/text_slot", params, "json", callback); },
        toggle_beacon (callback)               { command("POST", "/api/beacon", null, "", callback); },
        park_channel (params = {}, callback)  { command("POST", "/api/channel", params, "json", callback); },
        unpark_channel (params = {}, callback)  { command("DELETE", "/api/channel", params, "json", callback); },
        clear_log (callback)               { command("DELETE", "/api/log", null, "", callback); },
        send_cdg_selected (callback)               { command("POST", "/api/cdg_beacon", null, "", callback); },
        start_rdm_discovery (params = {}, callback)  { command("POST", "api/rdm/discovery", params, "json", callback); },
        start_rdm_get (params = {}, callback)  { command("POST", "api/rdm/get", params, "json", callback); },
        start_rdm_set (params = {}, callback)  { command("POST", "api/rdm/set", params, "json", callback); },
        reload_dropped_project (callback)               { command("POST", "/api/project/reload_dropped", null, "json", callback); },
        send_ping (params = {}, callback)  { command("POST", "/api/ping", params, "json", callback); },

        set_success_handler (success)            { setHandler("query_success", success); },
        set_error_handler (error)              { setHandler("query_error", error); },
        set_restart_handler (restart)            { setHandler("query_restart", restart); },
        set_redirect_handler (redirect)           { onRedirect = redirect || identity; },

        set_query_string (query)              { queryString = query; },

        request,
        subscribe,
        command,
    };
})();
