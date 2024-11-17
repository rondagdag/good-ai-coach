import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { initChatModel } from "langchain/chat_models/universal";
import { Calculator } from "@langchain/community/tools/calculator";
import { z } from "zod";
import { tool } from "@langchain/core/tools";

//#region model
import { model } from "model.js"
//#endregion

//#region tools
const todayDateTimeSchema = z.object({
  timeZone: z.string().describe("Time Zone Format"),
  locale: z.string().describe("Locale string")
});

function getTodayDateTime({timeZone, locale}: { timeZone: string; locale: string }) {
  //const timeZone = 'America/Chicago';
  //const locale = 'en-US';
  const today = new Date();
  const formattedDate = today.toLocaleString(locale, {
      timeZone: timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  const result = {
      "formattedDate": formattedDate,
      "timezone": timeZone
  };
  console.log(result)
  return JSON.stringify(result);
}

const dateTool = tool(
  ({timeZone, locale}) => {
    return getTodayDateTime({timeZone, locale});
  },
  {
    name: "todays_date_time",
    description:
      "Useful to get current day, date and time.",
    schema: todayDateTimeSchema,
  }
);

console.log(await dateTool.invoke({timeZone: 'America/New_York', locale: 'en-US'}));

const calculator = new Calculator();
const tools = [dateTool, calculator];

const toolNode = new ToolNode(tools as any);
//#endregion

//#region "model node"
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;

  const llmWithTools = model.bindTools(tools);
  const result = await llmWithTools.invoke(messages);
  console.log(result);
  return { messages: [result] };
};
//#endregion

//#region "should continue node"
const shouldContinue = (state: typeof MessagesAnnotation.State) => {
  const { messages } = state;

  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage._getType() !== "ai" ||
    !(lastMessage as AIMessage).tool_calls?.length
  ) {
    // LLM did not call any tools, or it's not an AI message, so we should end.
    return END;
  }
  return "tools";
};
//#endregion

//#region workflow
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END]);

export const agentWithDynamicToolsGraph = workflow.compile()
agentWithDynamicToolsGraph.name = "06 Agent With Dynamic Tooling";
//#endregion

//#region draw graph
import { saveGraphAsImage } from "drawGraph.js"
await saveGraphAsImage(agentWithDynamicToolsGraph)
//#endregion