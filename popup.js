// Enhanced WISE Clinical Research Assistant - Version 2.0
// Advanced clinical research tool with local data storage and intelligent website suggestions

// ==================== CONFIGURATION ====================
const CONFIG = {
  API_KEY: 'AIzaSyBTAQqxYxYHoBp1r2brVsAHGMeFmP24gRw',
  MODEL_NAME: 'gemini-2.0-flash',
  API_VERSION: 'v1beta',
  STORAGE_KEY: 'wise_clinical_research',
  EXPORT_FOLDER: 'WISE Clinician Assistant'
};

// ==================== GLOBAL VARIABLES ====================
let currentAnalysis = null;
let pageMetadata = null;
let currentTopic = null;
let researchData = {
  topics: {},
  sites: {},
  analyses: {},
  settings: {
    localStorage: false,
    autoSuggest: true,
    notifications: false
  }
};

// ==================== MEDICAL WEBSITE DATABASE ====================
const MEDICAL_WEBSITES = {
  'diabetes': [
    { name: 'Mayo Clinic - Diabetes', url: 'https://www.mayoclinic.org/diseases-conditions/diabetes', category: 'comprehensive' },
    { name: 'WebMD - Diabetes Center', url: 'https://www.webmd.com/diabetes/default.htm', category: 'patient' },
    { name: 'American Diabetes Association', url: 'https://www.diabetes.org/', category: 'professional' },
    { name: 'PubMed - Diabetes Research', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=diabetes', category: 'research' }
  ],
  'hypertension': [
    { name: 'Mayo Clinic - High Blood Pressure', url: 'https://www.mayoclinic.org/diseases-conditions/high-blood-pressure', category: 'comprehensive' },
    { name: 'American Heart Association', url: 'https://www.heart.org/en/health-topics/high-blood-pressure', category: 'professional' },
    { name: 'WebMD - Hypertension', url: 'https://www.webmd.com/hypertension-high-blood-pressure/default.htm', category: 'patient' }
  ],
  'covid': [
    { name: 'WHO - COVID-19', url: 'https://www.who.int/health-topics/coronavirus', category: 'official' },
    { name: 'CDC - COVID-19', url: 'https://www.cdc.gov/coronavirus/2019-ncov/index.html', category: 'official' },
    { name: 'PubMed - COVID Research', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=covid-19', category: 'research' }
  ],
  'cancer': [
    { name: 'National Cancer Institute', url: 'https://www.cancer.gov/', category: 'official' },
    { name: 'Mayo Clinic - Cancer', url: 'https://www.mayoclinic.org/diseases-conditions/cancer', category: 'comprehensive' },
    { name: 'American Cancer Society', url: 'https://www.cancer.org/', category: 'patient' }
  ],
  'default': [
    { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org/diseases-conditions', category: 'comprehensive' },
    { name: 'WebMD A-Z', url: 'https://www.webmd.com/a-to-z-guides/common-topics', category: 'patient' },
    { name: 'MedlinePlus', url: 'https://medlineplus.gov/healthtopics.html', category: 'official' },
    { name: 'PubMed Central', url: 'https://www.ncbi.nlm.nih.gov/pmc/', category: 'research' },
    { name: 'WHO Health Topics', url: 'https://www.who.int/health-topics', category: 'official' },
    { name: 'Apollo Hospitals', url: 'https://www.apollohospitals.com/patient-care/health-and-lifestyle/diseases-and-conditions/', category: 'comprehensive' }
  ]
};

// ==================== DOM ELEMENTS ====================
const elements = {
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Research Tab
  diseaseSearch: document.getElementById('diseaseSearch'),
  currentTopic: document.getElementById('currentTopic'),
  topicName: document.getElementById('topicName'),
  topicStats: document.getElementById('topicStats'),
  suggestedSites: document.getElementById('suggestedSites'),
  sitesList: document.getElementById('sitesList'),
  analyzePage: document.getElementById('analyzePage'),
  addToRepo: document.getElementById('addToRepo'),
  changeTopic: document.getElementById('changeTopic'),
  exportData: document.getElementById('exportData'),
  output: document.getElementById('output'),
  
  // Repository Tab
  repoList: document.getElementById('repoList'),
  
  // Insights Tab
  insightsList: document.getElementById('insightsList'),
  
  // Settings Tab
  localStorageToggle: document.getElementById('localStorageToggle'),
  autoSuggestToggle: document.getElementById('autoSuggestToggle'),
  notificationsToggle: document.getElementById('notificationsToggle'),
  
  // Help Tab
  helpGuide: document.getElementById('helpGuide'),
  reportBug: document.getElementById('reportBug'),
  requestFeature: document.getElementById('requestFeature'),
  betaProgram: document.getElementById('betaProgram'),
  feedbackForm: document.getElementById('feedbackForm'),
  feedbackTitle: document.getElementById('feedbackTitle'),
  feedbackName: document.getElementById('feedbackName'),
  feedbackEmail: document.getElementById('feedbackEmail'),
  feedbackMessage: document.getElementById('feedbackMessage'),
  feedbackType: document.getElementById('feedbackType'),
  submitFeedback: document.getElementById('submitFeedback'),
  
  // Notification
  notification: document.getElementById('notification')
};

// ==================== UTILITY FUNCTIONS ====================
function showNotification(message, type = 'success') {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type} show`;
  setTimeout(() => {
    elements.notification.classList.remove('show');
  }, 3000);
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ==================== STORAGE FUNCTIONS ====================
async function loadResearchData() {
  try {
    const result = await chrome.storage.local.get([CONFIG.STORAGE_KEY]);
    if (result[CONFIG.STORAGE_KEY]) {
      researchData = { ...researchData, ...result[CONFIG.STORAGE_KEY] };
    }
  } catch (error) {
    console.error('Error loading research data:', error);
  }
}

async function saveResearchData() {
  try {
    await chrome.storage.local.set({ [CONFIG.STORAGE_KEY]: researchData });
  } catch (error) {
    console.error('Error saving research data:', error);
  }
}

async function exportToFile() {
  try {
    const exportData = {
      exportDate: getCurrentTimestamp(),
      version: '2.0',
      data: researchData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `WISE_Clinical_Research_${new Date().toISOString().split('T')[0]}.json`;
    
    await chrome.downloads.download({
      url: url,
      filename: `${CONFIG.EXPORT_FOLDER}/${filename}`,
      saveAs: true
    });
    
    showNotification('Research data exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Failed to export data. Please try again.', 'error');
  }
}

// ==================== TOPIC MANAGEMENT ====================
function setCurrentTopic(topic) {
  currentTopic = topic.toLowerCase().trim();
  elements.topicName.textContent = topic;
  elements.currentTopic.style.display = 'block';
  updateTopicStats();
  showSuggestedSites();
}

function updateTopicStats() {
  if (!currentTopic) return;
  
  const topicData = researchData.topics[currentTopic] || { saved: 0, analyzed: 0 };
  elements.topicStats.textContent = `${topicData.saved} saved, ${topicData.analyzed} analyzed`;
}

function showSuggestedSites() {
  if (!currentTopic) return;
  
  // Find relevant websites based on topic
  let sites = MEDICAL_WEBSITES.default;
  
  for (const [keyword, siteList] of Object.entries(MEDICAL_WEBSITES)) {
    if (currentTopic.includes(keyword) || keyword.includes(currentTopic)) {
      sites = siteList;
      break;
    }
  }
  
  // Add status information
  const sitesWithStatus = sites.map(site => {
    const siteKey = site.url;
    const siteData = researchData.sites[siteKey] || { status: 'unvisited' };
    return { ...site, status: siteData.status };
  });
  
  elements.sitesList.innerHTML = sitesWithStatus.map(site => `
    <div class="site-item" data-url="${site.url}">
      <div>
        <strong>${site.name}</strong>
        <div style="font-size: 12px; opacity: 0.8;">${site.category} • ${site.url}</div>
      </div>
      <div class="site-status status-${site.status}">
        ${site.status === 'unvisited' ? 'New' : 
          site.status === 'visited' ? 'Visited' :
          site.status === 'analyzed' ? 'Analyzed' : 'Saved'}
      </div>
    </div>
  `).join('');
  
  elements.suggestedSites.style.display = 'block';
  
  // Add click handlers
  elements.sitesList.querySelectorAll('.site-item').forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      chrome.tabs.create({ url: url });
      updateSiteStatus(url, 'visited');
    });
  });
}

function updateSiteStatus(url, status) {
  if (!researchData.sites[url]) {
    researchData.sites[url] = { status: 'unvisited', firstVisited: null, lastAnalyzed: null };
  }
  
  researchData.sites[url].status = status;
  
  if (status === 'visited' && !researchData.sites[url].firstVisited) {
    researchData.sites[url].firstVisited = getCurrentTimestamp();
  }
  
  if (status === 'analyzed') {
    researchData.sites[url].lastAnalyzed = getCurrentTimestamp();
  }
  
  saveResearchData();
  showSuggestedSites(); // Refresh the display
}

// ==================== ANALYSIS FUNCTIONS ====================
async function getPageMetadata() {
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const searchContext = getSearchContext(tab.url);
    
    return {
      url: tab.url,
      title: tab.title,
      searchContext: searchContext,
      timestamp: getCurrentTimestamp(),
      topic: currentTopic
    };
  } catch (error) {
    console.error('Error getting page metadata:', error);
    return {
      url: 'Unknown',
      title: 'Unknown',
      searchContext: null,
      timestamp: getCurrentTimestamp(),
      topic: currentTopic
    };
  }
}

function getSearchContext(url) {
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    
    const searchTerms = searchParams.get('q') || 
                       searchParams.get('query') || 
                       searchParams.get('search') ||
                       searchParams.get('term');
    
    return searchTerms ? `results for "${searchTerms}"` : null;
  } catch (e) {
    return null;
  }
}

async function callGeminiAPI(pageText) {
  const prompt = `
    You are a helpful clinical assistant. Analyze the following webpage text and provide:
    1. A concise summary (1-2 bullet points)
    2. Any mentioned medical conditions (list them or say "N/A" if none)
    3. Any mentioned medications (list them or say "N/A" if none)
    4. Any potential drug interactions (list them or say "N/A" if none/no multiple medications)
    5. Clinical confidence level (High/Medium/Low) for the information presented
    6. Key clinical insights or recommendations
    
    If the content is clearly non-medical (news, sports, entertainment, etc.), provide a brief summary indicating this is not medical content, and use "N/A" for medical fields.
    
    Return ONLY valid JSON with this exact structure:
    {
      "summary": "your summary here",
      "conditions": "list or N/A",
      "medications": "list or N/A", 
      "interactions": "list or N/A",
      "confidence": "High/Medium/Low",
      "insights": "key clinical insights or N/A"
    }
    
    Webpage Text: ${pageText.substring(0, 12000)}
  `;

  const requestData = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const API_URL = `https://generativelanguage.googleapis.com/${CONFIG.API_VERSION}/models/${CONFIG.MODEL_NAME}:generateContent?key=${CONFIG.API_KEY}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`HTTP Error! Status: ${response.status}, Details: ${errorDetail}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("API response contains no 'candidates'. This might be due to safety filters.");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error("API candidate missing 'content' or 'parts'.");
    }

    const responseText = candidate.content.parts[0].text;
    console.log("Raw API response:", responseText);

    // Extract JSON from response
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let jsonString = jsonMatch ? jsonMatch[1] : responseText;

    // Clean the JSON string
    jsonString = jsonString.trim();
    if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
      return JSON.parse(jsonString);
    } else {
      throw new Error("API response is not valid JSON");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    if (error instanceof SyntaxError) {
      throw new Error("Unexpected token - response is not valid JSON");
    }
    
    throw new Error(`Failed to get analysis from AI: ${error.message}`);
  }
}

function createAnalysisDisplay(analysis) {
  const hasMedicalContent = analysis.conditions && analysis.conditions !== 'N/A' && !analysis.conditions.toLowerCase().includes('no medical');
  
  let analysisHtml = `
    <div class="metadata">
      <div class="metadata-item"><strong>Source:</strong> ${pageMetadata.url}</div>
      <div class="metadata-item"><strong>Page Title:</strong> ${pageMetadata.title}</div>
      <div class="metadata-item"><strong>Research Topic:</strong> ${currentTopic || 'General'}</div>
      ${pageMetadata.searchContext ? `<div class="metadata-item"><strong>Context:</strong> ${pageMetadata.searchContext}</div>` : ''}
      <div class="metadata-item"><strong>Analyzed:</strong> ${formatDate(pageMetadata.timestamp)}</div>
      <div class="metadata-item"><strong>Confidence Level:</strong> ${analysis.confidence || 'N/A'}</div>
    </div>
    <div class="output-section">
      <div class="section-title"><span class="emoji">📋</span>Summary</div>
      <div class="section-content">${analysis.summary || 'N/A'}</div>
    </div>
    <div class="output-section">
      <div class="section-title"><span class="emoji">🏥</span>Medical Conditions</div>
      <div class="section-content">${analysis.conditions || 'N/A'}</div>
    </div>
    <div class="output-section">
      <div class="section-title"><span class="emoji">💊</span>Medications</div>
      <div class="section-content">${analysis.medications || 'N/A'}</div>
    </div>
    <div class="output-section">
      <div class="section-title"><span class="emoji">⚠️</span>Drug Interactions</div>
      <div class="section-content">${analysis.interactions || 'N/A'}</div>
    </div>
    <div class="output-section">
      <div class="section-title"><span class="emoji">💡</span>Clinical Insights</div>
      <div class="section-content">${analysis.insights || 'N/A'}</div>
    </div>
  `;

  if (!hasMedicalContent) {
    analysisHtml += `
      <div class="suggestion-note">
        <strong>💡 Tip:</strong> This page appears to contain limited medical content. 
        For better clinical insights, try analyzing medical websites like Mayo Clinic, WebMD, or PubMed.
      </div>
    `;
  }

  return analysisHtml;
}

// ==================== REPOSITORY FUNCTIONS ====================
async function addToRepository() {
  if (!currentAnalysis || !pageMetadata) {
    showNotification('No analysis data to save!', 'error');
    return;
  }
  
  try {
    const analysisId = `${pageMetadata.url}_${Date.now()}`;
    const repositoryItem = {
      id: analysisId,
      url: pageMetadata.url,
      title: pageMetadata.title,
      topic: currentTopic || 'General',
      analysis: currentAnalysis,
      metadata: pageMetadata,
      savedAt: getCurrentTimestamp()
    };
    
    // Store in research data
    researchData.analyses[analysisId] = repositoryItem;
    
    // Update topic statistics
    if (currentTopic) {
      if (!researchData.topics[currentTopic]) {
        researchData.topics[currentTopic] = { saved: 0, analyzed: 0 };
      }
      researchData.topics[currentTopic].saved++;
    }
    
    // Update site status
    updateSiteStatus(pageMetadata.url, 'saved');
    
    // Save to storage
    await saveResearchData();
    
    // Update UI
    updateRepositoryDisplay();
    updateTopicStats();
    
    showNotification('Analysis saved to research repository!', 'success');
    elements.addToRepo.disabled = true;
    
  } catch (error) {
    console.error('Error saving to repository:', error);
    showNotification('Failed to save analysis. Please try again.', 'error');
  }
}

function updateRepositoryDisplay() {
  const analyses = Object.values(researchData.analyses);
  
  if (analyses.length === 0) {
    elements.repoList.innerHTML = `
      <div style="text-align: center; opacity: 0.7; padding: 20px;">
        <span class="emoji">📝</span>No research saved yet. Start analyzing pages to build your repository!
      </div>
    `;
    return;
  }
  
  // Group by topic
  const groupedByTopic = analyses.reduce((acc, item) => {
    const topic = item.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});
  
  elements.repoList.innerHTML = Object.entries(groupedByTopic).map(([topic, items]) => `
    <div class="repo-item">
      <h4>${topic} (${items.length} items)</h4>
      ${items.slice(0, 3).map(item => `
        <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
          <div style="font-weight: 500; font-size: 13px;">${item.title}</div>
          <div style="font-size: 11px; opacity: 0.8;">${formatDate(item.savedAt)}</div>
          <div style="font-size: 11px; opacity: 0.8;">${item.url}</div>
        </div>
      `).join('')}
      ${items.length > 3 ? `<div style="font-size: 12px; opacity: 0.7; text-align: center;">... and ${items.length - 3} more</div>` : ''}
    </div>
  `).join('');
}

// ==================== INSIGHTS FUNCTIONS ====================
function updateInsightsDisplay() {
  const analyses = Object.values(researchData.analyses);
  
  if (analyses.length < 2) {
    elements.insightsList.innerHTML = `
      <div style="text-align: center; opacity: 0.7; padding: 20px;">
        <span class="emoji">🔍</span>Analyze and save at least 2 research items to see insights and comparisons!
      </div>
    `;
    return;
  }
  
  // Generate insights
  const insights = generateInsights(analyses);
  
  elements.insightsList.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <div style="font-weight: 500; margin-bottom: 5px;">${insight.title}</div>
      <div style="font-size: 13px;">${insight.description}</div>
    </div>
  `).join('');
}

function generateInsights(analyses) {
  const insights = [];
  
  // Group by topic
  const topicGroups = analyses.reduce((acc, item) => {
    const topic = item.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});
  
  // Generate topic-specific insights
  Object.entries(topicGroups).forEach(([topic, items]) => {
    if (items.length >= 2) {
      insights.push({
        title: `📊 Research Depth: ${topic}`,
        description: `You have ${items.length} research items for ${topic}. Consider comparing different sources for comprehensive understanding.`
      });
      
      // Check for conflicting information
      const conditions = items.map(item => item.analysis.conditions).filter(c => c && c !== 'N/A');
      if (conditions.length >= 2) {
        insights.push({
          title: `⚠️ Potential Conflicts: ${topic}`,
          description: `Multiple sources mention different conditions. Review for conflicting treatment approaches.`
        });
      }
    }
  });
  
  // Overall insights
  insights.push({
    title: '🎯 Research Progress',
    description: `You have analyzed ${analyses.length} pages across ${Object.keys(topicGroups).length} topics. Keep building your clinical knowledge base!`
  });
  
  return insights;
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
  // Tab switching
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      elements.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
      
      // Update displays when switching to specific tabs
      if (tabName === 'repository') {
        updateRepositoryDisplay();
      } else if (tabName === 'insights') {
        updateInsightsDisplay();
      }
    });
  });
  
  // Disease search
  elements.diseaseSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const searchTerm = elements.diseaseSearch.value.trim();
      if (searchTerm) {
        setCurrentTopic(searchTerm);
        elements.changeTopic.style.display = 'inline-block';
      }
    }
  });
  
  // Analyze page
  elements.analyzePage.addEventListener('click', async () => {
    elements.analyzePage.disabled = true;
    elements.analyzePage.textContent = '⏳ Analyzing...';
    
    try {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot analyze this browser page. Please navigate to a medical/diseases information website.');
      }

      // Get page metadata
      pageMetadata = await getPageMetadata();

      // Extract page content
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText
      });

      const pageText = injectionResults[0].result;
      
      if (!pageText || pageText.trim().length < 50) {
        throw new Error('Page does not contain enough text to analyze. Please try a different medical website.');
      }

      // Analyze with AI
      const analysis = await callGeminiAPI(pageText);
      currentAnalysis = analysis;

      // Ensure all fields have proper values
      currentAnalysis.summary = currentAnalysis.summary || 'N/A';
      currentAnalysis.conditions = currentAnalysis.conditions || 'N/A';
      currentAnalysis.medications = currentAnalysis.medications || 'N/A';
      currentAnalysis.interactions = currentAnalysis.interactions || 'N/A';
      currentAnalysis.confidence = currentAnalysis.confidence || 'N/A';
      currentAnalysis.insights = currentAnalysis.insights || 'N/A';

      // Update UI
      elements.output.innerHTML = createAnalysisDisplay(analysis);
      elements.addToRepo.disabled = false;
      
      // Update site status
      updateSiteStatus(pageMetadata.url, 'analyzed');
      
      // Update topic statistics
      if (currentTopic) {
        if (!researchData.topics[currentTopic]) {
          researchData.topics[currentTopic] = { saved: 0, analyzed: 0 };
        }
        researchData.topics[currentTopic].analyzed++;
        updateTopicStats();
      }
      
      showNotification('Page analyzed successfully!', 'success');

    } catch (error) {
      console.error("Error in analysis:", error);
      elements.output.innerHTML = `
        <div class="output-section">
          <div class="section-title"><span class="emoji">❌</span>Analysis Failed</div>
          <div class="section-content">${error.message}</div>
        </div>
      `;
      showNotification('Analysis failed. Please try again.', 'error');
      currentAnalysis = null;
    } finally {
      elements.analyzePage.disabled = false;
      elements.analyzePage.textContent = '🔍 Analyze Current Page';
    }
  });
  
  // Add to repository
  elements.addToRepo.addEventListener('click', addToRepository);
  
  // Export data
  elements.exportData.addEventListener('click', exportToFile);
  
  // Change topic
  elements.changeTopic.addEventListener('click', () => {
    elements.diseaseSearch.value = '';
    elements.diseaseSearch.focus();
    elements.changeTopic.style.display = 'none';
    elements.currentTopic.style.display = 'none';
    currentTopic = null;
  });
  
  // Settings toggles
  elements.localStorageToggle.addEventListener('click', () => {
    elements.localStorageToggle.classList.toggle('active');
    researchData.settings.localStorage = elements.localStorageToggle.classList.contains('active');
    saveResearchData();
  });
  
  elements.autoSuggestToggle.addEventListener('click', () => {
    elements.autoSuggestToggle.classList.toggle('active');
    researchData.settings.autoSuggest = elements.autoSuggestToggle.classList.contains('active');
    saveResearchData();
  });
  
  elements.notificationsToggle.addEventListener('click', () => {
    elements.notificationsToggle.classList.toggle('active');
    researchData.settings.notifications = elements.notificationsToggle.classList.contains('active');
    saveResearchData();
  });
  
  // Help section
  elements.helpGuide.addEventListener('click', () => {
    showNotification('User guide coming soon!', 'info');
  });
  
  elements.reportBug.addEventListener('click', () => {
    showFeedbackForm('Bug Report');
  });
  
  elements.requestFeature.addEventListener('click', () => {
    showFeedbackForm('Feature Request');
  });
  
  elements.betaProgram.addEventListener('click', () => {
    showFeedbackForm('Beta Program');
  });
  
  elements.submitFeedback.addEventListener('click', submitFeedback);
}

function showFeedbackForm(type) {
  elements.feedbackTitle.textContent = type;
  elements.feedbackType.value = type.toLowerCase().replace(' ', '_');
  elements.feedbackForm.style.display = 'block';
}

async function submitFeedback() {
  const feedback = {
    name: elements.feedbackName.value,
    email: elements.feedbackEmail.value,
    message: elements.feedbackMessage.value,
    type: elements.feedbackType.value,
    timestamp: getCurrentTimestamp()
  };
  
  if (!feedback.name || !feedback.message) {
    showNotification('Please fill in required fields.', 'error');
    return;
  }
  
  try {
    // Store feedback locally (in a real app, this would be sent to a server)
    const feedbackData = await chrome.storage.local.get(['feedback']);
    const existingFeedback = feedbackData.feedback || [];
    existingFeedback.push(feedback);
    await chrome.storage.local.set({ feedback: existingFeedback });
    
    showNotification('Feedback submitted successfully!', 'success');
    elements.feedbackForm.style.display = 'none';
    
    // Clear form
    elements.feedbackName.value = '';
    elements.feedbackEmail.value = '';
    elements.feedbackMessage.value = '';
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('Failed to submit feedback. Please try again.', 'error');
  }
}

// ==================== INITIALIZATION ====================
async function initialize() {
  try {
    // Load existing research data
    await loadResearchData();
    
    // Initialize UI
    initializeEventListeners();
    
    // Load settings
    elements.localStorageToggle.classList.toggle('active', researchData.settings.localStorage);
    elements.autoSuggestToggle.classList.toggle('active', researchData.settings.autoSuggest);
    elements.notificationsToggle.classList.toggle('active', researchData.settings.notifications);
    
    // Initialize displays
    updateRepositoryDisplay();
    updateInsightsDisplay();
    
    console.log('WISE Clinical Research Assistant initialized successfully');
    
  } catch (error) {
    console.error('Error initializing extension:', error);
    showNotification('Failed to initialize extension. Please reload.', 'error');
  }
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);
