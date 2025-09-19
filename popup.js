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
    notifications: false,
    cdssWishlist: true
  },
  currentSearchTerm: null
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
  searchButton: document.getElementById('searchButton'),
  currentTopic: document.getElementById('currentTopic'),
  topicName: document.getElementById('topicName'),
  topicStats: document.getElementById('topicStats'),
  suggestedSites: document.getElementById('suggestedSites'),
  sitesList: document.getElementById('sitesList'),
  analyzePage: document.getElementById('analyzePage'),
  addToRepo: document.getElementById('addToRepo'),
  changeTopic: document.getElementById('changeTopic'),
  output: document.getElementById('output'),
  
  // Repository Tab
  repoList: document.getElementById('repoList'),
  
  // Insights Tab
  insightsList: document.getElementById('insightsList'),
  exportInsights: document.getElementById('exportInsights'),
  
  // Settings Tab
  localStorageToggle: document.getElementById('localStorageToggle'),
  storagePath: document.getElementById('storagePath'),
  notificationsToggle: document.getElementById('notificationsToggle'),
  cdssWishlistToggle: document.getElementById('cdssWishlistToggle'),
  
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

async function exportInsightsToFile() {
  try {
    const analyses = Object.values(researchData.analyses);
    const insights = generateTopicInsights(analyses);
    
    // Create HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WISE Clinical Research Insights Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 50%, #10b981 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .insight-item { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; }
        .card { background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; }
        .cdss { background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 WISE Clinical Research Insights Report</h1>
        <p>Generated on ${formatDate(getCurrentTimestamp())}</p>
    </div>
    <div class="content">
        ${insights.replace(/style="[^"]*"/g, '').replace(/class="[^"]*"/g, '')}
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlReport], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const filename = `WISE_Clinical_Insights_${new Date().toISOString().split('T')[0]}.html`;
    
    await chrome.downloads.download({
      url: url,
      filename: `${CONFIG.EXPORT_FOLDER}/${filename}`,
      saveAs: true
    });
    
    showNotification('Insights report exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting insights:', error);
    showNotification('Failed to export insights. Please try again.', 'error');
  }
}

// ==================== TOPIC MANAGEMENT ====================
function setCurrentTopic(topic) {
  currentTopic = topic.toLowerCase().trim();
  researchData.currentSearchTerm = topic; // Preserve the original search term
  elements.topicName.textContent = topic;
  elements.currentTopic.style.display = 'block';
  updateTopicStats();
  showSuggestedSites();
  saveResearchData(); // Save the search term
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
    
    // Auto-switch to repository tab to show the latest addition
    switchToTab('repository');
    
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
  
  // Sort by date (reverse chronological - newest first)
  const sortedAnalyses = analyses.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  
  // Group by topic
  const groupedByTopic = sortedAnalyses.reduce((acc, item) => {
    const topic = item.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});
  
  elements.repoList.innerHTML = Object.entries(groupedByTopic).map(([topic, items]) => `
    <div class="repo-item">
      <h4>${topic} (${items.length} items)</h4>
      ${items.slice(0, 5).map(item => `
        <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px;">
          <div style="font-weight: 500; font-size: 13px;">${item.title}</div>
          <div style="font-size: 11px; opacity: 0.8;">${formatDate(item.savedAt)}</div>
          <div style="font-size: 11px; opacity: 0.8;">${item.url}</div>
        </div>
      `).join('')}
      ${items.length > 5 ? `<div style="font-size: 12px; opacity: 0.7; text-align: center;">... and ${items.length - 5} more</div>` : ''}
    </div>
  `).join('');
}

// ==================== INSIGHTS FUNCTIONS ====================
function updateInsightsDisplay() {
  const analyses = Object.values(researchData.analyses);
  
  if (analyses.length === 0) {
    elements.insightsList.innerHTML = `
      <div style="text-align: center; opacity: 0.7; padding: 20px;">
        <span class="emoji">🔍</span>Analyze and save research to see insights and comparisons!
      </div>
    `;
    elements.exportInsights.disabled = true;
    return;
  }
  
  // Generate topic-based insights
  const topicInsights = generateTopicInsights(analyses);
  
  elements.insightsList.innerHTML = topicInsights;
  elements.exportInsights.disabled = false;
}

function generateTopicInsights(analyses) {
  // Group by topic
  const topicGroups = analyses.reduce((acc, item) => {
    const topic = item.topic || 'General';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {});
  
  let insightsHtml = '';
  
  Object.entries(topicGroups).forEach(([topic, items]) => {
    const analysis = analyzeTopicData(topic, items);
    
    insightsHtml += `
      <div class="insight-item" style="margin-bottom: 20px;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 10px; color: #10b981;">
          📊 ${topic.charAt(0).toUpperCase() + topic.slice(1)} Research Analysis
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
            <div style="font-weight: 500; margin-bottom: 8px;">📈 Research Breadth & Depth</div>
            <div style="font-size: 13px;">Sources: ${items.length} | Confidence: ${analysis.avgConfidence}</div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
            <div style="font-weight: 500; margin-bottom: 8px;">⚠️ Treatment Variations</div>
            <div style="font-size: 13px;">Diversity Level: ${analysis.treatmentDiversity}</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">🌍 Regional</div>
            <div style="font-size: 11px;">${analysis.regionalVariation}</div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">👥 Social</div>
            <div style="font-size: 11px;">${analysis.socialVariation}</div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">💰 Economic</div>
            <div style="font-size: 11px;">${analysis.economicVariation}</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">🔍 Diagnosis</div>
            <div style="font-size: 11px;">${analysis.diagnosisConfidence}</div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">💊 Treatment</div>
            <div style="font-size: 11px;">${analysis.treatmentConfidence}</div>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">📈 Efficacy</div>
            <div style="font-size: 11px;">${analysis.efficacyConfidence}</div>
          </div>
        </div>
        
        <div style="background: rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 8px; border-left: 3px solid #10b981;">
          <div style="font-weight: 500; font-size: 12px; margin-bottom: 5px;">🎯 CDSS Recommendation</div>
          <div style="font-size: 11px;">${analysis.cdssRecommendation}</div>
        </div>
      </div>
    `;
  });
  
  return insightsHtml;
}

function analyzeTopicData(topic, items) {
  // Analyze confidence levels
  const confidences = items.map(item => item.analysis.confidence).filter(c => c && c !== 'N/A');
  const avgConfidence = confidences.length > 0 ? 
    confidences.reduce((sum, c) => {
      const level = c.toLowerCase();
      return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : 1);
    }, 0) / confidences.length : 0;
  
  const confidenceLevel = avgConfidence >= 2.5 ? 'High' : avgConfidence >= 1.5 ? 'Medium' : 'Low';
  
  // Analyze treatment diversity
  const treatments = items.map(item => item.analysis.medications).filter(t => t && t !== 'N/A');
  const uniqueTreatments = new Set(treatments.flatMap(t => t.split(',').map(s => s.trim())));
  const treatmentDiversity = uniqueTreatments.size >= 5 ? 'High' : uniqueTreatments.size >= 3 ? 'Medium' : 'Low';
  
  // Analyze variations (simplified for this iteration)
  const regionalVariation = items.length >= 3 ? 'Medium' : 'Low';
  const socialVariation = items.length >= 4 ? 'High' : items.length >= 2 ? 'Medium' : 'Low';
  const economicVariation = items.length >= 3 ? 'Medium' : 'Low';
  
  // AI confidence levels
  const diagnosisConfidence = confidenceLevel;
  const treatmentConfidence = treatmentDiversity === 'High' ? 'Medium' : confidenceLevel;
  const efficacyConfidence = items.length >= 3 ? 'Medium' : 'Low';
  
  // CDSS recommendation
  const cdssRecommendation = items.length >= 3 ? 
    `Strong candidate for CDSS integration. ${items.length} sources provide comprehensive coverage.` :
    items.length >= 2 ?
    `Good candidate for CDSS. Consider adding more sources for better coverage.` :
    `Limited data available. Add more research before CDSS integration.`;
  
  return {
    avgConfidence: confidenceLevel,
    treatmentDiversity,
    regionalVariation,
    socialVariation,
    economicVariation,
    diagnosisConfidence,
    treatmentConfidence,
    efficacyConfidence,
    cdssRecommendation
  };
}

// ==================== TAB MANAGEMENT ====================
function switchToTab(tabName) {
  // Update active tab
  elements.tabs.forEach(t => t.classList.remove('active'));
  const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetTab) targetTab.classList.add('active');
  
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
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
  // Tab switching
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      switchToTab(tabName);
    });
  });
  
  // Disease search
  function performSearch() {
    const searchTerm = elements.diseaseSearch.value.trim();
    if (searchTerm) {
      setCurrentTopic(searchTerm);
      elements.changeTopic.style.display = 'inline-block';
    }
  }
  
  elements.diseaseSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  elements.searchButton.addEventListener('click', performSearch);
  
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
  
  // Export insights
  elements.exportInsights.addEventListener('click', exportInsightsToFile);
  
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
    elements.storagePath.style.display = researchData.settings.localStorage ? 'block' : 'none';
    saveResearchData();
  });
  
  elements.cdssWishlistToggle.addEventListener('click', () => {
    elements.cdssWishlistToggle.classList.toggle('active');
    researchData.settings.cdssWishlist = elements.cdssWishlistToggle.classList.contains('active');
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
  elements.feedbackType.value = type;
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
    // Create email content
    const subject = `WISE Clinical Assistant - ${feedback.type}`;
    const body = `
Name: ${feedback.name}
Email: ${feedback.email}
Type: ${feedback.type}
Timestamp: ${formatDate(feedback.timestamp)}

Message:
${feedback.message}

---
Sent from WISE Clinical Assistant Chrome Extension
    `.trim();
    
    // Create mailto link
    const mailtoLink = `mailto:wiseaihub@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.open(mailtoLink, '_blank');
    
    showNotification('Email client opened with your feedback!', 'success');
    elements.feedbackForm.style.display = 'none';
    
    // Clear form
    elements.feedbackName.value = '';
    elements.feedbackEmail.value = '';
    elements.feedbackMessage.value = '';
    
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showNotification('Failed to open email client. Please try again.', 'error');
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
    elements.storagePath.style.display = researchData.settings.localStorage ? 'block' : 'none';
    elements.cdssWishlistToggle.classList.toggle('active', researchData.settings.cdssWishlist);
    
    // Restore search term if available
    if (researchData.currentSearchTerm) {
      elements.diseaseSearch.value = researchData.currentSearchTerm;
      setCurrentTopic(researchData.currentSearchTerm);
      elements.changeTopic.style.display = 'inline-block';
    }
    
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
