local http = minetest.request_http_api()

if not http then
    minetest.log("error", "[chat_sync] HTTP no está disponible. Configura 'secure.http_mods' en minetest.conf")
    return
end

local SERVER_NAME = "Servidor_2" 
local SERVER_URL = "http://193.24.210.158:6000"

local last_message_id = 0  

minetest.register_on_chat_message(function(name, message)
    local data = minetest.write_json({ player = name, text = message, server = SERVER_NAME })

    http.fetch({
        url = SERVER_URL .. "/chat",
        method = "POST",
        data = data,
        timeout = 5,
        extra_headers = { "Content-Type: application/json" },
    }, function(result)
        if result.succeeded then
            minetest.log("action", "[chat_sync] Mensaje enviado correctamente.")
        else
            minetest.log("error", "[chat_sync] Error al enviar mensaje.")
        end
    end)

    return false  
end)

local function fetch_messages()
    http.fetch({
        url = SERVER_URL .. "/messages?server=" .. SERVER_NAME .. "&last_id=" .. last_message_id,
        method = "GET",
        timeout = 5,
    }, function(result)
        if result.succeeded then
            local messages = minetest.parse_json(result.data)
            if messages and type(messages) == "table" then
                for _, msg in ipairs(messages) do
                    if msg.id > last_message_id then
                        local prefix = ""
                        if msg.server == "Discord" then
                            prefix = minetest.colorize("#FF4500", "[Discord] ")
                        else
                            prefix = minetest.colorize("#00ffff", "[Chat Global] ")
                        end
                        
                        minetest.chat_send_all(prefix ..
                                                 minetest.colorize("#ffff00", msg.player .. ": ") ..
                                                 msg.text)
                        last_message_id = msg.id
                    end
                end
            end
        else
            minetest.log("error", "[chat_sync] Error al obtener mensajes.")
        end
    end)
end

local timer = 0
minetest.register_globalstep(function(dtime)
    timer = timer + dtime
    if timer >= 3 then  
        fetch_messages()
        timer = 0
    end
end)
