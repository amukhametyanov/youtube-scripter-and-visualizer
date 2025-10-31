
export interface Scene {
  title: string;
  script: string;
  visual_prompt: string;
}

export interface ScriptData {
  title: string;
  scenes: Scene[];
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface ScriptGenerationResult {
  scriptData: ScriptData;
  groundingChunks: GroundingChunk[];
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}
