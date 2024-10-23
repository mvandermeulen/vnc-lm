import { Client, Channel } from 'discord.js';
import { MessageData, Conversation } from './types';
import { cacheStore } from './store';

export class CacheManager {
  public static initializeCache(): void {
    console.log('Cache initialized.');
  }

  public static async restoreMessageDataFromCache(client: Client): Promise<void> {
    for (const conversation of Object.values(cacheStore.getConversations())) {
      for (const item of conversation.messages) {
        try {
          const channel = await client.channels.fetch(item.channelId);
          if (channel?.isTextBased()) {
            const message = await channel.messages.fetch(item.messageId);
            if (message) {
              cacheStore.messageDataMap.set(message.id, item.data);
            }
          }
        } catch (error) { /* Silently ignore errors when messages are not found */ }
      }
    }
  }

  public static getCurrentConversations(): { [id: string]: Conversation } {
    return cacheStore.getConversations();
  }

  public static createNewConversation(): string {
    const state = cacheStore.getState();
    const conversationId = `conv-${(++state.conversationCounter).toString().padStart(4, '0')}`;
    
    cacheStore.cache.conversations[conversationId] = {
      id: conversationId,
      startTimestamp: Date.now(),
      messages: []
    };
    
    cacheStore.updateState({ 
      currentConversationId: conversationId,
      conversationCounter: state.conversationCounter
    });
    
    return conversationId;
  }

  public static updateMessageCache(
    messageId: string,
    channelId: string,
    content: string,
    isUserMessage: boolean,
    additionalData: Partial<MessageData> = {}
  ): void {
    const currentConversationId = cacheStore.getState().currentConversationId;
    if (!currentConversationId || !cacheStore.cache.conversations[currentConversationId]) return;
  
    const conversation = cacheStore.cache.conversations[currentConversationId];
    
    // Check if message already exists in the conversation
    const existingMessageIndex = conversation.messages.findIndex(msg => msg.messageId === messageId);
  
    const messageData = {
      messageId,
      channelId,
      data: { content, isUserMessage, ...additionalData }
    };
  
    if (existingMessageIndex !== -1) {
      // Update existing message instead of adding a new one
      conversation.messages[existingMessageIndex] = messageData;
    } else {
      // Add new message only if it doesn't exist
      conversation.messages.push(messageData);
      cacheStore.updateState({ 
        messageCount: cacheStore.getState().messageCount + 1 
      });
    }
  
    cacheStore.saveCache();
  }

  public static getActiveChannel(): Channel | null {
    const activeChannelId = cacheStore.getState().activeChannel;
    return activeChannelId ? { id: activeChannelId } as Channel : null;
  }

  public static setActiveChannel(channel: Channel | null): void {
    cacheStore.updateState({ activeChannel: channel?.id || null });
  }
}