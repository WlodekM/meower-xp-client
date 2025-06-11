# soktdeer-xp-client

A silly little soktdeer client made to work on old browsers.

> [!NOTE]
> This client was tested on firefox 12.0 and firefox 40.0, i do not guarantee that it will work on earlier versions and/or other browsers

## Setting up

> [!NOTE]
> i think because of the way i have set up https on chaosdeer (it is optional), firefox 12.0 can kinda just,, connect, so uh yeah, proxy is optional

Since Firefox 40.0 doesn't support secure websockets (``wss://``)
You will have to set up a proxy websocket, for this i have provided the code for a simple proxy in the `proxy` folder.

### Running the proxy

If you are running this on a modern browser (or on a browser that doesnt support websockets) [you can skip this section](#running-the-client)

> [!NOTE]
> To run the proxy you will have to have nodejs installed

To run the proxy, you will first have to install the dependancies, to do that run
```bash
npm install
```
In a terminal
> [!IMPORTANT]
> Make sure to run the command in the same folder where you put the proxy code and the package.json file in

After it has finished installing all the dependencies, run this to start the proxy
```bash
node index.js
```
> [!NoTe]
> To close the server, press <kbd>Ctrl</kbd> + <kbd>C</kbd> or close you terminal

### Running the client

To open the client ~~go to [the client's website](https://wlodekm.github.io/meower-xp-client/) or~~ open the index.html file in your browser (might not work)

## Reccomended IDE setup

Windows XP SP2 with notepad++ (whatever version works, doesn't matter that much) and firefox 50.0
