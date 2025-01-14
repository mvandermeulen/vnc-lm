import { AxiosResponse } from 'axios';
import { defaultNumCtx, defaultKeepAlive } from './constants';
import { chatBot } from '../api-connections';
import { getState, setActiveChannel } from '../managers/cache';

export class BotSettings {
  // Default template name
  static templateName = "default";
  // Holds the current API request
  static currentRequest: Promise<AxiosResponse<any>> | null = null;

  static async initialize(client: any): Promise<void> {
    const state = getState();
    if (state.activeChannel) {
      try {
        // Attempt to fetch the previously active channel
        const channel = await client.channels.fetch(state.activeChannel);
        setActiveChannel(channel);
        if (channel && 'name' in channel) {
          console.log(`Resumed active channel: ${channel.name}`);
        }
      } catch (error) {
        console.log('Unable to fetch active channel. Setting to null.');
        setActiveChannel(null);
      }
    }
  
    if (state.lastUsedModel) {
      // Restore previous chat settings
      chatBot.modelName = state.lastUsedModel;
      chatBot.system = state.lastSystemPrompt || null;
      chatBot.temperature = state.lastTemperature || 0.4;
      chatBot.numCtx = state.lastNumCtx || defaultNumCtx;
      chatBot.keepAlive = state.lastKeepAlive || defaultKeepAlive;
    }
  }
}