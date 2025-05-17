class LlmApiService {
  constructor() {
    this.apiKeyProvider = this._getStoredProviderPreference() || 'Azure OpenAI';
    this.defaultEndpoints = {
      OpenAI: "https://api.openai.com/v1/chat/completions",
      "Azure OpenAI": "", // This will be set by the user
    };
    this.currentApiKey = '';
    this.currentApiEndpoint = '';
    this._loadApiConfigForProvider(this.apiKeyProvider);
  }

  _getStorage() {
    try {
      const storage = localStorage.getItem("p5jsStoryMakerLlmConfig");
      return storage ? JSON.parse(storage) : {};
    } catch (e) {
      console.error("Error parsing LlmApiService config from localStorage:", e);
      return {};
    }
  }

  _setStorage(storage) {
    try {
      localStorage.setItem("p5jsStoryMakerLlmConfig", JSON.stringify(storage));
    } catch (e) {
      console.error("Error setting LlmApiService config to localStorage:", e);
    }
  }

  _getStoredProviderPreference() {
    return this._getStorage().API_PROVIDER_PREFERENCE;
  }

  _getStoredOpenAIApiKey() {
    return this._getStorage().OPENAI_API_KEY;
  }

  _getStoredAzureApiKey() {
    return this._getStorage().AZURE_OAI_API_KEY;
  }

  _getStoredAzureEndpoint() {
    return this._getStorage().AZURE_OAI_ENDPOINT;
  }

  _loadApiConfigForProvider(provider) {
    this.apiKeyProvider = provider;
    if (provider === 'Azure OpenAI') {
      this.currentApiKey = this._getStoredAzureApiKey() || '';
      this.currentApiEndpoint = this._getStoredAzureEndpoint() || '';
    } else { // OpenAI
      this.currentApiKey = this._getStoredOpenAIApiKey() || '';
      this.currentApiEndpoint = this.defaultEndpoints.OpenAI;
    }
  }

  saveApiConfig(provider, apiKey, azureEndpoint = "") {
    const storage = this._getStorage();
    storage.API_PROVIDER_PREFERENCE = provider;
    this.apiKeyProvider = provider;

    if (provider === 'Azure OpenAI') {
      if (!apiKey || !azureEndpoint || azureEndpoint.trim() === '') {
        console.error("For Azure OpenAI, please provide both an API Key and a valid Endpoint URL.");
        return false;
      }
      storage.AZURE_OAI_API_KEY = apiKey;
      storage.AZURE_OAI_ENDPOINT = azureEndpoint.trim().replace(/\/$/, ""); // Remove trailing slash if any
      this.currentApiKey = apiKey;
      this.currentApiEndpoint = storage.AZURE_OAI_ENDPOINT;
    } else { // OpenAI Provider
      if (!apiKey) {
        console.error("For OpenAI, please provide an API Key.");
        return false;
      }
      storage.OPENAI_API_KEY = apiKey;
      this.currentApiKey = apiKey;
      this.currentApiEndpoint = this.defaultEndpoints.OpenAI;
    }

    this._setStorage(storage);
    console.log("LlmApiService: API Keys and preference saved successfully.");
    return true;
  }

  getApiInfo() {
    this._loadApiConfigForProvider(this._getStoredProviderPreference() || 'Azure OpenAI');

    return {
      apiKey: this.currentApiKey || null,
      endpoint: this.currentApiEndpoint || null,
      provider: this.apiKeyProvider,
    };
  }

  async makeApiCall(messages, options = {}) {
    const apiInfo = this.getApiInfo();

    if (!apiInfo.apiKey) {
      throw new Error("API key not found. Please configure it.");
    }
    if (apiInfo.provider === 'Azure OpenAI' && (!apiInfo.endpoint || apiInfo.endpoint.trim() === '')) {
      throw new Error("Azure OpenAI endpoint not configured. Please configure it.");
    }

    const { model = "gpt-4.1-mini", deploymentName = "gpt-4.1-mini", max_tokens = 1000, temperature = 0.7 } = options;

    let url;
    let headers;
    let bodyPayload;

    if (apiInfo.provider === 'Azure OpenAI') {
      url = `${apiInfo.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`;
      headers = {
        'Content-Type': 'application/json',
        'api-key': apiInfo.apiKey
      };
      bodyPayload = {
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature,
      };
    } else { // Standard OpenAI
      url = apiInfo.endpoint; 
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiInfo.apiKey}`
      };
      bodyPayload = {
        model: model, 
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature
      };
    }

    console.log(`LlmApiService: Making API call to ${apiInfo.provider} at ${url} with model/deployment: ${apiInfo.provider === 'Azure OpenAI' ? deploymentName : model}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson = {};
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // Ignore if error response is not JSON
        }
        console.error("LlmApiService API Error:", response.status, errorJson.error?.message || errorText);
        throw new Error(errorJson.error?.message || `API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        console.error("LlmApiService API Error: Invalid response structure", data);
        throw new Error("API response did not contain expected data structure.");
      }
    } catch (error) {
      console.error("LlmApiService: Error during fetch operation", error);
      throw error; 
    }
  }
}

export default LlmApiService; 