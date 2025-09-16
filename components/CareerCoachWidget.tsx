// FIX: Correctly import useState and useCallback from React to resolve hook-related errors.
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActiveView, UserProfile, ChatMessage, FeatureFlags } from '../types';
import WelcomeHub from './WelcomeHub';
import SalaryInsights from './views/SalaryInsights';
import ResumeScore from './views/ResumeScore';
import ResumeRewrite from './views/ResumeRewrite';
import BulletPointOptimizer from './views/BulletPointOptimizer';
import CoverLetterGenerator from './views/CoverLetterGenerator';
import LinkedInHeadline from './views/LinkedInHeadline';
import LinkedInAbout from './views/LinkedInAbout';
import SkillAssessment from './views/SkillAssessment';
import InterviewPrep from './views/InterviewPrep';
import Referrals from './views/Referrals';
import FindJobs from './views/FindJobs';
import Chat from './views/Chat';
import { ArrowLeft, User, Send, Plus, Mic, X, MessageSquare } from 'lucide-react';
import PlacementPlan from './views/PlacementPlan';
import ProfileSettings from './views/ProfileSettings';
import Chip from './shared/Chip';
import { getChatResponse } from '../services/geminiService';
import { DAILY_CREDIT_ALLOCATION } from '../constants';

const LOCAL_STORAGE_KEY = 'careerCoachProfile';

const CareerCoachWidget: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('welcome');
  const [postOnboardingView, setPostOnboardingView] = useState<ActiveView | null>(null);
  const [isProcessingResumeInBackground, setIsProcessingResumeInBackground] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pendingChatQuestion, setPendingChatQuestion] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        return { ...parsed, resumeFile: null }; 
      }
    } catch (error) {
      console.error("Failed to load profile from local storage", error);
    }
    return { 
      name: 'Rajinder',
      jobTitle: "", 
      resumeText: null, 
      resumeFile: null, 
      resumeFileName: null,
      location: null, 
      yearsOfExperience: null,
      completedSteps: [],
      placementPlan: null,
      skills: [],
      interviewPrepJobDescription: '',
      interviewQuestions: null,
      credits: DAILY_CREDIT_ALLOCATION,
      lastCreditReset: new Date().toISOString().split('T')[0],
      salaryInsightsCache: null,
      linkedInHeadlineCache: null,
      linkedInAboutCache: null,
      resumeScoreCache: null,
    };
  });
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);
  
  useEffect(() => {
    // Daily Credit Reset Logic
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastCreditReset !== today) {
        updateProfile({
            credits: DAILY_CREDIT_ALLOCATION,
            lastCreditReset: today,
        });
    }
  }, []); // Run only once on mount

  useEffect(() => {
    try {
      const profileToSave = { ...profile };
      delete (profileToSave as Partial<UserProfile>).resumeFile;
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
    } catch (error) {
      console.error("Failed to save profile to local storage", error);
    }
  }, [profile]);


  useEffect(() => {
    const fetchFeatureFlags = async () => {
        try {
            const response = await fetch('/features.json');
            const data = await response.json();
            setFeatureFlags(data);
        } catch (error) {
            console.error("Failed to fetch feature flags:", error);
        }
    };
    fetchFeatureFlags();
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll whenever messages update, with a small delay for rendering
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  useEffect(() => {
    // Also scroll when switching to the chat view
    if (activeView === 'chat') {
        setTimeout(scrollToBottom, 100); // Small delay to ensure render
    }
  }, [activeView]);
  
  // Effect to add initial bot message if chat is enabled
  useEffect(() => {
    if (featureFlags?.enableChat && messages.length === 0) {
      const initialBotMessage: ChatMessage = {
        id: Date.now(),
        text: '',
        isBot: true,
        status: 'thinking',
      };
      setMessages([initialBotMessage]);

      setTimeout(() => {
        setMessages([
          { ...initialBotMessage, text: 'Hi, how can I help you today?', status: 'complete' }
        ]);
      }, 1200);
    }
  }, [featureFlags?.enableChat]);
  
  const handleSendMessage = async (prompt?: string) => {
    const messageText = (prompt || chatInput).trim();
    if (messageText === "") return;

    const isBotTyping = messages.some(m => m.isBot && m.status === 'thinking');
    if (isBotTyping) return;

    if (activeView !== 'chat') {
      setActiveView('chat');
    }

    const newUserMessage: ChatMessage = { id: Date.now(), text: messageText, isBot: false };
    setMessages(prev => [...prev, newUserMessage]);
    setChatInput('');

    /*
    // User requested to disable the profile completion check to allow direct chatting.
    const isProfileComplete = profile.jobTitle && profile.yearsOfExperience !== null;
    if (!isProfileComplete) {
        setPendingChatQuestion(messageText);
        const botMessageId = Date.now() + 1;
        const thinkingMessage: ChatMessage = { id: botMessageId, isBot: true, text: '', status: 'thinking' };
        setMessages(prev => [...prev, thinkingMessage]);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const responseMessage: ChatMessage = {
            id: botMessageId,
            isBot: true,
            status: 'complete',
            text: "Sure, I am here to help. To provide you personalized guidance, please provide your basic details.",
            action: { text: "Provide Details", view: 'profile-settings' }
        };
        setMessages(prev => prev.map(m => m.id === botMessageId ? responseMessage : m));
        return;
    }
    */

    const botMessageId = Date.now() + 1;
    const thinkingMessage: ChatMessage = { id: botMessageId, text: '', isBot: true, status: 'thinking' };
    setMessages(prev => [...prev, thinkingMessage]);

    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    try {
        const response = await getChatResponse(messageText, profile);
        const responseMessage: ChatMessage = {
            id: botMessageId,
            text: response.text,
            isBot: true,
            status: 'complete',
            videoUrl: response.videoUrl,
        };
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? responseMessage : msg));
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = {
            id: botMessageId,
            text: "Sorry, I encountered an error. Please try again.",
            isBot: true,
            status: 'complete',
        };
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? errorMessage : msg));
    }
  };

  useEffect(() => {
    // This logic is related to the commented-out profile completion check and is no longer needed.
    /*
    const isProfileComplete = profile.jobTitle && profile.yearsOfExperience !== null;
    if (pendingChatQuestion && isProfileComplete) {
      const questionToAsk = pendingChatQuestion;
      setPendingChatQuestion(null);
      setTimeout(() => handleSendMessage(questionToAsk), 0);
    }
    */
  }, [profile, pendingChatQuestion]);


  const navigateTo = (view: ActiveView) => {
    const onboardingRequiredViews: ActiveView[] = [
        'salary-insights', 'resume-score', 'resume-rewrite', 'bullet-point-optimizer',
        'cover-letter', 'linkedin-headline', 'linkedin-about', 'skill-assessment', 'interview-prep', 'jobs', 'placement-plan'
    ];
    const isProfileComplete = profile.jobTitle && profile.yearsOfExperience !== null;

    if (onboardingRequiredViews.includes(view) && !isProfileComplete) {
        setPostOnboardingView(view);
        setActiveView('profile-settings');
    } else {
        setActiveView(view);
    }
  };

  const handleGoToProfileAndReturn = (returnView: ActiveView) => {
    setPostOnboardingView(returnView);
    setActiveView('profile-settings');
  };

  const renderView = (): React.ReactNode => {
    switch (activeView) {
      case 'welcome': return <WelcomeHub startAction={navigateTo} featureFlags={featureFlags} chatHistory={messages}/>;
      case 'chat': return <Chat profile={profile} messages={messages} messagesEndRef={messagesEndRef} setActiveView={navigateTo}/>;
      case 'salary-insights': return <SalaryInsights profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} isProcessingResume={isProcessingResumeInBackground} />;
      case 'resume-score': return <ResumeScore profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} isProcessingResume={isProcessingResumeInBackground} handleGoToProfile={handleGoToProfileAndReturn} />;
      case 'resume-rewrite': return <ResumeRewrite profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} />;
      case 'bullet-point-optimizer': return <BulletPointOptimizer profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} />;
      case 'cover-letter': return <CoverLetterGenerator profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} isProcessingResume={isProcessingResumeInBackground} />;
      case 'linkedin-headline': return <LinkedInHeadline profile={profile} updateProfile={updateProfile} setActiveView={navigateTo} handleGoToProfile={handleGoToProfileAndReturn} />;
      case 'linkedin-about': return <LinkedInAbout profile={profile} updateProfile={updateProfile} setActiveView={navigateTo} handleGoToProfile={handleGoToProfileAndReturn} />;
      case 'skill-assessment': return <SkillAssessment profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} isProcessingResume={isProcessingResumeInBackground} handleGoToProfile={handleGoToProfileAndReturn} />;
      case 'placement-plan': return <PlacementPlan profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} />;
      case 'interview-prep': return <InterviewPrep profile={profile} setActiveView={navigateTo} updateProfile={updateProfile} isProcessingResume={isProcessingResumeInBackground} handleGoToProfile={handleGoToProfileAndReturn} />;
      case 'referrals': return <Referrals />;
      case 'jobs': return <FindJobs profile={profile} updateProfile={updateProfile} setActiveView={navigateTo} />;
      // FIX: Pass the required 'postOnboardingView' prop to the ProfileSettings component. Also pass 'pendingChatQuestion' to ensure full functionality.
      case 'profile-settings': return <ProfileSettings profile={profile} updateProfile={updateProfile} setActiveView={setActiveView} postOnboardingView={postOnboardingView} setPostOnboardingView={setPostOnboardingView} pendingChatQuestion={pendingChatQuestion} setIsProcessingResumeInBackground={setIsProcessingResumeInBackground} />;
      default: return <WelcomeHub startAction={navigateTo} featureFlags={featureFlags} chatHistory={messages}/>;
    }
  };

  const isBotTyping = messages.some(m => m.isBot && m.status === 'thinking');

  const suggestedPrompts = [
      "How can I get more interview calls?",
      "How can I get noticed by a recruiter?",
      "How do I get a referral?"
  ];


  return (
    <div className="w-full h-full bg-white text-gray-900 overflow-hidden flex flex-col font-sans border border-gray-200">
      
      <header className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
            {activeView !== 'welcome' && (
                <button onClick={() => setActiveView('welcome')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">brilliaAI</h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 px-3 py-1.5 rounded-full bg-gray-100">Credits: {profile.credits}</span>
            <button
                onClick={() => navigateTo('profile-settings')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium"
            >
                <User className="w-4 h-4" />
                My Profile
            </button>
        </div>
      </header>
      
      {globalError && (
        <div className="p-4 bg-red-100 border-b border-t border-red-200 text-red-700 text-sm flex items-center justify-between gap-4 animate-fade-in">
          <p className="flex-1">{globalError}</p>
          <button onClick={() => setGlobalError(null)} className="p-1 rounded-full hover:bg-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
        {renderView()}
      </main>

      {featureFlags?.enableChat && (activeView === 'welcome' || activeView === 'chat') && (
        <footer className="p-4 border-t border-gray-200 bg-white/75 flex-shrink-0">
           <div className="flex items-start gap-2">
              <div className="relative flex-1">
                  <div className="relative flex items-center gap-2">
                          <div className="relative flex-1 flex items-center gap-2 p-2 bg-gray-100 rounded-xl">
                            <input
                              type="text"
                              placeholder="Ask a question..."
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500 pl-2"
                              disabled={isBotTyping}
                            />
                             <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-full"><Mic className="w-5 h-5"/></button>
                             <button onClick={() => handleSendMessage()} disabled={isBotTyping || !chatInput.trim()} className="p-2.5 rounded-full bg-brand text-white hover:bg-brand-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                          {activeView === 'welcome' && messages.length > 1 && (
                               <button onClick={() => setActiveView('chat')} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full ml-2" title="Continue Chat">
                                <MessageSquare className="w-5 h-5"/>
                               </button>
                          )}
                  </div>
                  {featureFlags?.showSuggestedPrompts && (activeView === 'welcome' || (activeView === 'chat' && messages.length <= 1)) && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                        {suggestedPrompts.map(prompt => (
                            <Chip key={prompt} onClick={() => handleSendMessage(prompt)}>{prompt}</Chip>
                        ))}
                    </div>
                  )}
              </div>
           </div>
        </footer>
      )}
    </div>
  );
};

export default CareerCoachWidget;