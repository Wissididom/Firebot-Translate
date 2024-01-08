import { Firebot } from "@crowbartools/firebot-custom-scripts-types";
import { Logger } from "@crowbartools/firebot-custom-scripts-types/types/modules/logger";
import axios from "axios";

async function handleGoogle(
  logger: Logger,
  apiKey: string,
  action: "detect" | "translate",
  text: string,
  target: string,
) {
  let requestObject = null;
  let detect: boolean;
  switch (action) {
    case "detect":
      requestObject = {
        method: "POST",
        url: "https://translate.googleapis.com/language/translate/v2/detect",
        data: `q=${encodeURIComponent(text)}&key=${encodeURIComponent(apiKey)}`,
      };
      detect = true;
      break;
    case "translate":
      requestObject = {
        method: "POST",
        url: "https://translate.googleapis.com/language/translate/v2",
        data: `q=${encodeURIComponent(text)}&target=${encodeURIComponent(
          target,
        )}&format=text&key=${encodeURIComponent(apiKey)}`,
      };
      detect = false;
      break;
  }
  if (!requestObject) return null;
  return await axios(requestObject)
    .then(async (res) => {
      if (res.status == 200) {
        if (detect) {
          return res.data.data.detections[0].language;
        } else {
          return res.data.data.translations[0].translatedText;
        }
      } else {
        logger.info(JSON.stringify(res.data)); // Actually json but logger.info only accepts strings
        return null;
      }
    })
    .catch((err) => {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error(err.response.data);
        logger.error(err.response.status);
        logger.error(err.response.headers);
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        logger.error(err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error("Error", err.message);
      }
      return null;
    });
}
async function handleDeepL(
  logger: Logger,
  apiKey: string,
  action: "detect" | "translate",
  text: string,
  target: string,
) {
  let requestObject = null;
  let detect: boolean;
  switch (action) {
    case "detect":
      return "Detecting a language by itself is not supported by the DeepL API";
    case "translate":
      requestObject = {
        method: "POST",
        url: "https://api-free.deepl.com/v2/translate",
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
        },
        data: {
          text: [text],
          target_lang: target,
        },
      };
      detect = false;
      break;
  }
  if (!requestObject) return null;
  return await axios(requestObject)
    .then(async (res) => {
      if (res.status == 200) {
        if (detect) {
          return null;
        } else {
          return res.data.translations[0].text;
        }
      } else {
        logger.info(JSON.stringify(res.data)); // Actually json but logger.info only accepts strings
        return null;
      }
    })
    .catch((err) => {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error(err.response.data);
        logger.error(err.response.status);
        logger.error(err.response.headers);
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        logger.error(err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error("Error", err.message);
      }
      return null;
    });
}

async function handleLibreTranslate(
  logger: Logger,
  apiKey: string,
  action: "detect" | "translate",
  text: string,
  target: string,
) {
  let requestObject = null;
  let detect: boolean;
  switch (action) {
    case "detect":
      requestObject = {
        method: "POST",
        url: "https://libretranslate.de/detect",
        data: `q=${encodeURIComponent(text)}&api_key=${encodeURIComponent(
          apiKey,
        )}`,
      };
      detect = true;
      break;
    case "translate":
      let detectedLanguage: string = await handleLibreTranslate(
        logger,
        apiKey,
        "detect",
        text,
        target,
      );
      requestObject = {
        method: "POST",
        url: "https://libretranslate.de/translate",
        data: `q=${encodeURIComponent(
          text,
        )}&source=${detectedLanguage}&target=${encodeURIComponent(
          target,
        )}&format=text&key=${encodeURIComponent(apiKey)}`,
      };
      detect = false;
      break;
  }
  if (!requestObject) return null;
  return await axios(requestObject)
    .then(async (res) => {
      if (res.status == 200) {
        if (detect) {
          return res.data[0].language;
        } else {
          return res.data.translatedText;
        }
      } else {
        logger.info(JSON.stringify(res.data)); // Actually json but logger.info only accepts strings
        return null;
      }
    })
    .catch((err) => {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error(err.response.data);
        logger.error(err.response.status);
        logger.error(err.response.headers);
      } else if (err.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        logger.error(err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error("Error", err.message);
      }
      return null;
    });
}

interface Params {
  api_key: string;
  provider: ("Google" | "DeepL" | "LibreTranslate")[];
  action: ("detect" | "translate")[];
  text: string;
  target: string;
  sendAs: ("streamer" | "bot")[];
}

const script: Firebot.CustomScript<Params> = {
  getScriptManifest: () => {
    return {
      name: "Firebot Translate",
      description: "A custom script to translate text using Google or DeepL",
      author: "Wissididom",
      version: "1.0",
      firebotVersion: "5",
    };
  },
  getDefaultParameters: () => {
    return {
      api_key: {
        type: "string",
        default: "",
        description: "The API Key for the selected service",
        secondaryDescription:
          "Enter the API Key for Google Translate or DeepL here. Make sure that you select the correct provider for that API Key below!",
      },
      provider: {
        type: "enum",
        default: "DeepL",
        description: "Provider",
        secondaryDescription:
          "The provider used for the translation or detection",
        options: ["Google", "DeepL", "LibreTranslate"],
      },
      action: {
        type: "enum",
        default: "translate",
        description: "Translate",
        secondaryDescription:
          "The action to take. Can be either translate or detect!",
        options: ["detect", "translate"],
      },
      text: {
        type: "string",
        default: "$arg[all]",
        description: "Text",
        secondaryDescription: "The text you want to translate",
      },
      target: {
        type: "string",
        default: "en",
        description: "Target",
        secondaryDescription:
          "The language you want to translate to. See https://cloud.google.com/translate/docs/languages for Google and https://developers.deepl.com/docs/resources/supported-languages#target-languages for DeepL",
      },
      sendAs: {
        type: "enum",
        default: "bot",
        description: "Send the chat message as",
        secondaryDescription: "'bot' has no effect if no bot user is set up",
        options: ["streamer", "bot"],
      },
    };
  },
  run: async (runRequest) => {
    const { logger } = runRequest.modules;
    const {
      api_key: apiKey,
      provider,
      action,
      text,
      target,
      sendAs,
    } = runRequest.parameters;
    let response: string = null;
    switch (provider as unknown) {
      case "Google":
        response = await handleGoogle(logger, apiKey, action, text, target);
        break;
      case "DeepL":
        response = await handleDeepL(logger, apiKey, action, text, target);
        break;
      case "LibreTranslate":
        response = await handleLibreTranslate(
          logger,
          apiKey,
          action,
          text,
          target,
        );
        break;
    }
    return {
      success: true,
      effects: [
        {
          chatter: sendAs,
          type: "firebot:chat",
          message: response ?? "Invalid translation provider or action!",
        },
      ],
    };
  },
};

export default script;
