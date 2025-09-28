export const OPENAI_REALTIME_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

export type OpenAIRealtimeSession = {
  id: string;
  object: string;
  model: string;
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  tools: any[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number;
  client_secret: {
    value: string;
    expires_at: number;
  };
  sessionConfig?: {
    instructions: string;
    tools: any[];
    audio: any;
    output_modalities: string[];
  };
  [key: string]: any;
};

export type OpenAIRealtimeClientEvent =
  | {
      type: "session.update";
      data: Partial<OpenAIRealtimeSession>;
    }
  | {
      type: "conversation.item.create";
      previous_item_id?: string;
      item: {
        id: string;
        type: string;
        role: string;
        content: [
          {
            type: string;
            text: string;
          },
        ];
      };
    };

export type OpenAIRealtimeServerEvent =
  | {
      type:
        | "input_audio_buffer.speech_started"
        | "input_audio_buffer.speech_stopped"
        | "input_audio_buffer.committed"
        | "output_audio_buffer.stopped"
        | "session.created"
        | "session.updated";
      event_id: string;
      item_id: string;
    }
  | {
      type: "conversation.item.added" | "conversation.item.done";
      event_id: string;
      previous_item_id?: string;
      item_id: string;
      item?: any;
    }
  | {
      type: "conversation.item.input_audio_transcription.delta";
      event_id: string;
      item_id: string;
      content_index: number;
      delta: string;
    }
  | {
      type: "conversation.item.input_audio_transcription.completed";
      event_id: string;
      item_id: string;
      content_index: number;
      transcript?: string;
    }
  | {
      type: "response.output_audio_transcript.delta";
      event_id: string;
      response_id: string;
      item_id: string;
      output_index: number;
      content_index: number;
      delta: string;
    }
  | {
      type: "response.output_audio_transcript.done";
      event_id: string;
      response_id: string;
      item_id: string;
      output_index: number;
      content_index: number;
      transcript: string;
    }
  | {
      type: "response.audio.done";
      event_id: string;
      response_id: string;
      item_id: string;
      output_index: number;
      content_index: number;
    }
  | {
      type: "response.function_call_arguments.done";
      event_id: string;
      response_id: string;
      item_id: string;
      output_index: number;
      name: string;
      call_id: string;
      arguments: string;
    };
