import { initChatModel } from "langchain/chat_models/universal";

//github
export const model = await initChatModel("gpt-4o", {
  modelProvider: "openai",
  temperature: 0,
  configuration: {
    baseURL: 'https://models.inference.ai.azure.com'
  }
});

// export const model = await initChatModel("llama3.2", {
//   modelProvider: "ollama",
//   temperature: 0,
// });
// export const model = await initChatModel("gpt-4", {
//   modelProvider: "azure_openai",
//   temperature: 0,
// });
// export const model = await initChatModel("gpt-4", {
//   modelProvider: "openai",
//   temperature: 0,
// });
// export const model = await initChatModel(undefined, {
//   modelProvider: "groq",
//   temperature: 0,
// });
