import MessageDuplex from '@ezpay/lib/MessageDuplex';
import EventChannel from '@ezpay/lib/EventChannel';
import Logger from '@ezpay/lib/logger';
import extensionizer from 'extensionizer';

const LocalMessageDuplexStream = require('post-message-stream')
const extension = require('extensionizer')
const PortStream = require('extension-port-stream')
const ObjectMultiplex = require('obj-multiplex')
const pump = require('pump')
const Dnode = require('dnode')

const logger = new Logger('content');

const content = {
    duplex: new MessageDuplex.Tab(),
    eventChannel: new EventChannel('contentScript'),

    init() {
        logger.info('Initialising ezPay');

        this.registerListeners();

        if (this.shouldInjectWeb3()) {
            this.inject();
            this.start();
        }
    },

    async start() {
        const pageStream = new LocalMessageDuplexStream({
            name: 'contentscript',
            target: 'inpage',
        })
        const extensionPort = extension.runtime.connect({ name: 'contentscript' })
        const extensionStream = new PortStream(extensionPort)
        const pageMux = new ObjectMultiplex()
        pageMux.setMaxListeners(25)
        const extensionMux = new ObjectMultiplex()
        extensionMux.setMaxListeners(25)

        pump(
            pageMux,
            pageStream,
            pageMux,
            (err) => logStreamDisconnectWarning('MetaMask Inpage Multiplex', err)
        )
        pump(
            extensionMux,
            extensionStream,
            extensionMux,
            (err) => logStreamDisconnectWarning('MetaMask Background Multiplex', err)
        )

        // forward communication across inpage-background for these channels only
        forwardTrafficBetweenMuxers('provider', pageMux, extensionMux)
        forwardTrafficBetweenMuxers('publicConfig', pageMux, extensionMux)

        // connect "phishing" channel to warning system
        const phishingStream = extensionMux.createStream('phishing')
        phishingStream.once('data', redirectToPhishingWarning)

        // connect "publicApi" channel to submit page metadata
        const publicApiStream = extensionMux.createStream('publicApi')
        // const background = await setupPublicApi(publicApiStream)
    },

    shouldInjectWeb3() {
        return true;
    },

    registerListeners() {
        this.eventChannel.on('tunnel', async data => {
            try {
                this.eventChannel.send(
                    'tabReply',
                    await this.duplex.send('tabRequest', data)
                );
            } catch(ex) {
                logger.info('Tab request failed:', ex);
            }
        });

        this.duplex.on('tunnel', ({ action, data }) => {
            this.eventChannel.send(action, data);
        });
    },

    inject() {
        const injectionSite = (document.head || document.documentElement);
        const container = document.createElement('script');

        container.src = extensionizer.extension.getURL('dist/pageHook.js');
        container.onload = function() {
            this.parentNode.removeChild(this);
        };

        injectionSite.insertBefore(
            container,
            injectionSite.children[ 0 ]
        );
    }
};

/**
 * Error handler for page to extension stream disconnections
 *
 * @param {string} remoteLabel Remote stream name
 * @param {Error} err Stream connection error
 */
function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskContentscript - lost connection to ${remoteLabel}`
  if (err) warningMsg += '\n' + err.stack
  console.warn(warningMsg)
}

/**
 * Redirects the current page to a phishing information page
 */
function redirectToPhishingWarning () {
  console.log('MetaMask - routing to Phishing Warning component')
  const extensionURL = extension.runtime.getURL('phishing.html')
  window.location.href = `${extensionURL}#${querystring.stringify({
    hostname: window.location.hostname,
    href: window.location.href,
  })}`
}

function forwardTrafficBetweenMuxers (channelName, muxA, muxB) {
  const channelA = muxA.createStream(channelName)
  const channelB = muxB.createStream(channelName)
  pump(
    channelA,
    channelB,
    channelA,
    (err) => logStreamDisconnectWarning(`MetaMask muxed traffic for channel "${channelName}" failed.`, err)
  )
}

async function setupPublicApi (outStream) {
  const api = {
    getSiteMetadata: (cb) => cb(null, getSiteMetadata()),
  }
  const dnode = Dnode(api)
  pump(
    outStream,
    dnode,
    outStream,
    (err) => {
      // report any error
      if (err) log.error(err)
    }
  )
  const background = await new Promise(resolve => dnode.once('remote', resolve))
  return background
}

function getSiteMetadata () {
  // get metadata
  const metadata = {
    name: getSiteName(window),
    icon: getSiteIcon(window),
  }
  return metadata
}

function getSiteName (window) {
  const document = window.document
  const siteName = document.querySelector('head > meta[property="og:site_name"]')
  if (siteName) {
    return siteName.content
  }

  const metaTitle = document.querySelector('head > meta[name="title"]')
  if (metaTitle) {
    return metaTitle.content
  }

  return document.title
}

/**
 * Extracts an icon for the site from the DOM
 */
function getSiteIcon (window) {
  const document = window.document

  // Use the site's favicon if it exists
  const shortcutIcon = document.querySelector('head > link[rel="shortcut icon"]')
  if (shortcutIcon) {
    return shortcutIcon.href
  }

  // Search through available icons in no particular order
  const icon = Array.from(document.querySelectorAll('head > link[rel="icon"]')).find((icon) => Boolean(icon.href))
  if (icon) {
    return icon.href
  }

  return null
}

content.init();
