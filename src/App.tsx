/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ArticleUploader from "./components/ArticleUploader";
import ArticleReader from "./components/ArticleReader";
import { User } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "upload" | "reader">("landing");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Attempt session restoration on startup
    const savedToken = localStorage.getItem("research_portal_token");
    if (savedToken) {
      restoreSession(savedToken);
    } else {
      setInitializing(false);
    }
  }, []);

  const restoreSession = async (savedToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${savedToken}`
        }
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        setToken(savedToken);
        setCurrentView("dashboard");
      } else {
        localStorage.removeItem("research_portal_token");
      }
    } catch (err) {
      console.error("Session restoration error:", err);
    } finally {
      setInitializing(false);
    }
  };

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem("research_portal_token", userToken);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("research_portal_token");
    setCurrentView("landing");
  };

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setCurrentView("reader");
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView("dashboard");
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-mono">INITIALIZING PORTAL SYSTEM ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 selection:bg-purple-600/30">
      {currentView === "landing" && (
        <LandingPage onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentView === "dashboard" && currentUser && (
        <Dashboard 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onSelectArticle={handleSelectArticle}
          onNavigateToUpload={() => setCurrentView("upload")}
          refreshTrigger={refreshTrigger}
        />
      )}

      {currentView === "upload" && currentUser && (
        <ArticleUploader 
          currentUserId={currentUser.id}
          onUploadSuccess={handleUploadSuccess}
          onBackToDashboard={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "reader" && currentUser && selectedArticleId && (
        <ArticleReader 
          articleId={selectedArticleId}
          currentUser={currentUser}
          onBackToDashboard={() => setCurrentView("dashboard")}
        />
      )}
    </div>
  );
}

