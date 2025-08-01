import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";

export const ChatButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const handleChatClick = () => {
    // Placeholder for future chat integration
    console.log("Abrindo chat com Evo.AI...");
    // TODO: Implementar abertura do chat quando a API estiver pronta
  };

  return (
    <button
      onClick={handleChatClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="chat-button group"
      title="Chat com Evo.AI - Assistente de Monitoramento"
    >
      <div className="relative">
        {isHovered ? (
          <Sparkles className="w-6 h-6 text-primary transition-all duration-300" />
        ) : (
          <MessageCircle className="w-6 h-6 text-primary transition-all duration-300" />
        )}
        
        {/* Notification dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse" />
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Evo.AI Assistant</span>
        </div>
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
      </div>
      
      {/* Ripple effect on click */}
      <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-active:scale-100 transition-transform duration-200" />
    </button>
  );
};