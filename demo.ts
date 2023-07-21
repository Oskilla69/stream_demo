import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, streamToResponse } from "ai";

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: // API KEY,
});
const openai = new OpenAIApi(config);

// event is of type H3Event
export default defineEventHandler(async (event: any) => {
  try {
    // Extract the `prompt` from the body of the request
    const { messages } = await readBody(event);


    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
    // NOTE: must have stream set to true
      stream: true,
      messages: messages,
      // max_tokens: 200,
    });
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    const reader = stream.getReader();
    return new Promise((resolve, reject) => {
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) {
            event.node.res.end();
            return;
          }
          event.node.res.write(value);
          read();
        });
      }
      read();
    });
  } catch (error) {
    throw error;
  }
});
