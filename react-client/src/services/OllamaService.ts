export interface OllamaGenerateRequest {
  /** The name of the model to use for generation (e.g., 'llama3.1:8b'). If not provided, uses the default model. */
  model?: string;
  /** The input text prompt to send to the model */
  prompt: string;
  /** Whether to stream the response in real-time (default: false) */
  stream?: boolean;
  /** Advanced generation parameters to control model behavior */
  options?: {
    /** Controls randomness: 0.0 = deterministic, 1.0 = very random (default: 0.7) */
    temperature?: number;
    /** Nucleus sampling: only consider tokens with top_p probability mass (default: 0.9) */
    top_p?: number;
    /** Top-k sampling: only consider the top k most likely tokens (default: 40) */
    top_k?: number;
    /** Penalty for repeating tokens: 1.0 = no penalty, 1.1 = slight penalty (default: 1.1) */
    repeat_penalty?: number;
    /** Random seed for reproducible results (default: random) */
    seed?: number;
    /** Maximum number of tokens to generate (default: 128) */
    num_predict?: number;
    /** Stop generation when any of these strings are encountered */
    stop?: string[];
  };
}

export interface OllamaGenerateResponse {
  /** The name of the model that generated this response */
  model: string;
  /** ISO timestamp when the response was created */
  created_at: string;
  /** The generated text response from the model */
  response: string;
  /** Whether this is the final response in the stream (true = complete) */
  done: boolean;
  /** Internal context tokens for continuing the conversation */
  context?: number[];
  /** Total time taken for the entire generation (in nanoseconds) */
  total_duration?: number;
  /** Time taken to load the model into memory (in nanoseconds) */
  load_duration?: number;
  /** Time taken to evaluate the input prompt (in nanoseconds) */
  prompt_eval_duration?: number;
  /** Time taken to generate the response tokens (in nanoseconds) */
  eval_duration?: number;
  /** Number of tokens generated in this response */
  eval_count?: number;
}

export interface OllamaModel {
  /** The name/identifier of the model (e.g., 'llama3.1:8b') */
  name: string;
  /** ISO timestamp when the model was last modified */
  modified_at: string;
  /** Size of the model file in bytes */
  size: number;
  /** SHA256 hash digest of the model file */
  digest: string;
  /** Detailed information about the model architecture and format */
  details: {
    /** Model format (e.g., 'gguf', 'ggml') */
    format: string;
    /** Model family (e.g., 'llama', 'mistral', 'codellama') */
    family: string;
    /** Number of parameters in the model (e.g., '8B', '70B') */
    parameter_size: string;
    /** Quantization level (e.g., 'q4_0', 'q8_0', 'f16') */
    quantization_level: string;
  };
}

export class OllamaService {
  private baseUrl: string;
  private readonly defaultModel: string = 'llama3.1:8b';

  constructor(baseUrl?: string) {
    // Use environment variable or default to localhost for development
    this.baseUrl = baseUrl || process.env.REACT_APP_OLLAMA_URL || 'http://192.168.86.29:11434';
  }

  /**
   * Generate a response from Ollama
   */
  async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
    // Use default model if none specified
    const requestWithModel = {
      ...request,
      model: request.model || this.defaultModel
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestWithModel),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Handle streaming response (multiple JSON objects)
      const lines = responseText.trim().split('\n');
      let fullResponse = '';
      let finalResponse: OllamaGenerateResponse | null = null;

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line) as OllamaGenerateResponse;
            fullResponse += data.response || '';
            
            if (data.done) {
              finalResponse = {
                ...data,
                response: fullResponse
              };
              break;
            }
          } catch (parseError) {
            console.warn('Failed to parse Ollama response line:', line);
          }
        }
      }

      if (finalResponse) {
        return finalResponse;
      } else {
        throw new Error('No complete response received from Ollama');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Ollama is not running. Please start Ollama and try again.');
      }
      throw error;
    }
  }

  /**
   * Generate a streaming response from Ollama
   */
  async *generateStream(request: OllamaGenerateRequest): AsyncGenerator<OllamaGenerateResponse> {
    // Use default model if none specified
    const requestWithModel = {
      ...request,
      model: request.model || this.defaultModel,
      stream: true
    };
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithModel),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              yield data;
            } catch (error) {
              console.warn('Failed to parse Ollama response line:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<{ models: OllamaModel[] }> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Pull a model
   */
  async pullModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelName: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Check if Ollama is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(modelName: string): Promise<OllamaModel> {
    const response = await fetch(`${this.baseUrl}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export a default instance
export const ollamaService = new OllamaService();
