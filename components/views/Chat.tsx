import React from 'react';
import { ChatMessage, UserProfile, ActiveView } from '../../types';
import TypingIndicator from '../shared/TypingIndicator';

interface ChatProps {
  profile: UserProfile;
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setActiveView: (view: ActiveView) => void;
}

const Chat: React.FC<ChatProps> = ({ profile, messages, messagesEndRef, setActiveView }) => {

  const Message: React.FC<{ message: ChatMessage }> = ({ message }) => {
      return (
        <div className={`flex flex-col ${message.isBot ? 'items-start' : 'items-end'}`}>
          <div className={`max-w-[85%] rounded-2xl text-sm ${message.isBot ? 'bg-gray-100 text-gray-800 rounded-bl-none' : 'bg-brand text-white rounded-br-none'} ${message.isBot && message.status === 'thinking' ? 'p-0' : 'p-3'}`}>
            
            {message.isBot && message.status === 'thinking' && <TypingIndicator />}

            {message.status !== 'thinking' && message.text && (
                <p className="whitespace-pre-wrap">
                    {message.text}
                </p>
            )}

            {message.action && (
              <button
                onClick={() => setActiveView(message.action!.view)}
                className="mt-3 w-full text-center px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                {message.action.text}
              </button>
            )}
            
            {message.videoUrl && (
                 <div className="mt-2 aspect-video rounded-lg overflow-hidden">
                     <iframe 
                        className="w-full h-full"
                        src={message.videoUrl} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen>
                     </iframe>
                 </div>
            )}
          </div>
        </div>
      );
  };
  
  return (
    <div className="flex flex-col h-full">
        {messages.length === 0 && (
             <div className="flex-1 flex flex-col justify-center items-center text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello, {profile.name}</h1>
                <p className="text-gray-600">How can I help you today?</p>
            </div>
        )}
       
        <div className={`flex-1 overflow-y-auto space-y-4 pr-2 pb-2 ${messages.length === 0 ? 'hidden' : ''}`}>
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    </div>
  );
};

export default Chat;