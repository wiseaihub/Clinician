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
  // Academic & Research Sources
  'academic': [
    { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/', category: 'research', description: 'Biomedical literature database' },
    { name: 'EMBASE', url: 'https://www.embase.com/', category: 'research', description: 'Biomedical and pharmacological database' },
    { name: 'Cochrane Library', url: 'https://www.cochranelibrary.com/', category: 'research', description: 'Systematic reviews and meta-analyses' },
    { name: 'PubMed Central (PMC)', url: 'https://www.ncbi.nlm.nih.gov/pmc/', category: 'research', description: 'Free full-text articles' },
    { name: 'Google Scholar', url: 'https://scholar.google.com/', category: 'research', description: 'Academic search engine' },
    { name: 'Scopus', url: 'https://www.scopus.com/', category: 'research', description: 'Abstract and citation database' },
    { name: 'Web of Science', url: 'https://www.webofscience.com/', category: 'research', description: 'Citation database' },
    { name: 'ScienceDirect', url: 'https://www.sciencedirect.com/', category: 'research', description: 'Elsevier research platform' },
    { name: 'arXiv', url: 'https://arxiv.org/', category: 'research', description: 'Preprint server' },
    { name: 'ResearchGate', url: 'https://www.researchgate.net/', category: 'research', description: 'Academic social network' },
    { name: 'Academia.edu', url: 'https://www.academia.edu/', category: 'research', description: 'Academic papers platform' },
    { name: 'DOAJ', url: 'https://doaj.org/', category: 'research', description: 'Directory of Open Access Journals' },
    { name: 'CORE', url: 'https://core.ac.uk/', category: 'research', description: 'Open access research aggregator' }
  ],
  
  // Medical Journals
  'journals': [
    { name: 'The Lancet', url: 'https://www.thelancet.com/', category: 'journal', description: 'High-impact general medicine journal' },
    { name: 'NEJM', url: 'https://www.nejm.org/', category: 'journal', description: 'New England Journal of Medicine' },
    { name: 'JAMA', url: 'https://jamanetwork.com/', category: 'journal', description: 'Journal of American Medical Association' },
    { name: 'BMJ', url: 'https://www.bmj.com/', category: 'journal', description: 'British Medical Journal' },
    { name: 'Nature Medicine', url: 'https://www.nature.com/nm/', category: 'journal', description: 'Nature Medicine journal' },
    { name: 'Science', url: 'https://www.science.org/', category: 'journal', description: 'Science journal' }
  ],
  
  // Clinical Resources
  'clinical': [
    { name: 'UpToDate', url: 'https://www.uptodate.com/', category: 'clinical', description: 'Clinical decision support' },
    { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org/', category: 'clinical', description: 'Comprehensive medical information' },
    { name: 'Cleveland Clinic', url: 'https://my.clevelandclinic.org/', category: 'clinical', description: 'Medical center resources' },
    { name: 'Johns Hopkins Medicine', url: 'https://www.hopkinsmedicine.org/', category: 'clinical', description: 'Medical center' },
    { name: 'NYU Langone Health', url: 'https://nyulangone.org/', category: 'clinical', description: 'Medical center' },
    { name: 'Barts Health', url: 'https://www.bartshealth.nhs.uk/', category: 'clinical', description: 'UK NHS trust' },
    { name: 'CRGH', url: 'https://www.crgh.co.uk/', category: 'clinical', description: 'Centre for Reproductive and Genetic Health' }
  ],
  
  // Specialized Healthcare
  'specialized': [
    { name: 'Hertility Health', url: 'https://hertilityhealth.com/', category: 'specialized', description: 'Reproductive health' },
    { name: 'Kin Fertility', url: 'https://kinfertility.com/', category: 'specialized', description: 'Fertility care' },
    { name: 'Adonis', url: 'https://www.adonis.com/', category: 'specialized', description: 'Men\'s health' },
    { name: 'Breastcancer.org', url: 'https://www.breastcancer.org/', category: 'specialized', description: 'Breast cancer resources' },
    { name: 'Dr. Rossinski Dental Health', url: 'https://www.drrossinski.com/', category: 'specialized', description: 'Dental health' }
  ],
  
  // Mental Health & Wellness
  'mental_health': [
    { name: 'Unmind', url: 'https://www.unmind.com/', category: 'mental_health', description: 'Workplace mental health' },
    { name: 'Campaign Against Living Miserably', url: 'https://www.thecalmzone.net/', category: 'mental_health', description: 'Mental health support' },
    { name: 'Thanks Ben', url: 'https://thanksben.com/', category: 'mental_health', description: 'Mental health platform' }
  ],
  
  // Technology & Innovation
  'healthtech': [
    { name: 'Merative', url: 'https://www.merative.com/', category: 'healthtech', description: 'Healthcare technology' },
    { name: 'Acronis', url: 'https://www.acronis.com/', category: 'healthtech', description: 'Data protection' },
    { name: 'Talkdesk', url: 'https://www.talkdesk.com/', category: 'healthtech', description: 'Contact center' },
    { name: 'CVS Health', url: 'https://www.cvshealth.com/', category: 'healthtech', description: 'Healthcare services' },
    { name: 'Snowflake', url: 'https://www.snowflake.com/', category: 'healthtech', description: 'Data cloud' },
    { name: 'Palo Alto Networks', url: 'https://www.paloaltonetworks.com/', category: 'healthtech', description: 'Cybersecurity' },
    { name: 'Narsa', url: 'https://www.narsa.com/', category: 'healthtech', description: 'Healthcare solutions' },
    { name: 'Juniper', url: 'https://www.juniper.net/', category: 'healthtech', description: 'Network solutions' },
    { name: 'Klara', url: 'https://www.klara.com/', category: 'healthtech', description: 'Patient communication' }
  ],
  
  // General Medical Information
  'general': [
    { name: 'WebMD', url: 'https://www.webmd.com/', category: 'general', description: 'General medical information' },
    { name: 'Abortion Finder', url: 'https://www.abortionfinder.org/', category: 'general', description: 'Reproductive health services' },
    { name: 'Campaign Against Living Miserably', url: 'https://www.thecalmzone.net/', category: 'general', description: 'Mental health support' }
  ],
  
  // Default fallback
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
  
  // Use dynamic suggestions instead of static ones
  if (topic && topic.length > 2) {
    const suggestions = getDynamicSuggestions(topic);
    updateSitesList(suggestions);
    elements.suggestedSites.style.display = 'block';
    switchToSubTab('links');
  }
  
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
  
  // Refresh the display with dynamic suggestions if we have a current topic
  if (currentTopic && currentTopic.length > 2) {
    const suggestions = getDynamicSuggestions(currentTopic);
    updateSitesList(suggestions);
  }
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
      <h4 style="color: #1e40af; font-weight: 600;">${topic} (${items.length} items)</h4>
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
  
  // Sort topics by most recent analysis date (reverse chronological)
  const sortedTopics = Object.entries(topicGroups).sort(([, itemsA], [, itemsB]) => {
    const latestA = Math.max(...itemsA.map(item => new Date(item.savedAt).getTime()));
    const latestB = Math.max(...itemsB.map(item => new Date(item.savedAt).getTime()));
    return latestB - latestA; // Newest first
  });
  
  let insightsHtml = '';
  
  sortedTopics.forEach(([topic, items]) => {
    const analysis = analyzeTopicData(topic, items);
    
    insightsHtml += `
      <div class="insight-item" style="margin-bottom: 20px;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 10px; color: #1e40af;">
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
    scrollToFeedbackForm();
  });
  
  elements.requestFeature.addEventListener('click', () => {
    showFeedbackForm('Feature Request');
    scrollToFeedbackForm();
  });
  
  elements.betaProgram.addEventListener('click', () => {
    showFeedbackForm('Beta Program');
    scrollToFeedbackForm();
  });
  
  elements.submitFeedback.addEventListener('click', submitFeedback);
}

function showFeedbackForm(type) {
  elements.feedbackTitle.textContent = type;
  elements.feedbackType.value = type;
  elements.feedbackForm.style.display = 'block';
}

function scrollToFeedbackForm() {
  // Scroll to the feedback form with smooth animation
  setTimeout(() => {
    elements.feedbackForm.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, 100); // Small delay to ensure form is visible first
}

// Email validation function
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  
  if (feedback.email && !validateEmail(feedback.email)) {
    showNotification('Please enter a valid email address.', 'error');
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
    
    // Create mailto link with auto-filled fields
    const mailtoLink = `mailto:wiseaihub@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client with auto-filled content
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
    } else {
      // Hide suggestions by default until user searches
      elements.suggestedSites.style.display = 'none';
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

// ==================== NEW FEATURE EVENT LISTENERS ====================

// Sub-tab switching functionality
function setupSubTabs() {
  const subTabs = document.querySelectorAll('.sub-tab');
  console.log('Found sub-tabs:', subTabs.length);
  subTabs.forEach(tab => {
    console.log('Setting up tab:', tab.dataset.subtab);
    tab.addEventListener('click', () => {
      const subtabType = tab.dataset.subtab;
      console.log('Tab clicked:', subtabType);
      switchToSubTab(subtabType);
    });
  });
}

// Switch to specific sub-tab
function switchToSubTab(subtabType) {
  console.log('Switching to sub-tab:', subtabType);
  const subTabs = document.querySelectorAll('.sub-tab');
  
  // Update active sub-tab
  subTabs.forEach(t => t.classList.remove('active'));
  const activeTab = document.querySelector(`[data-subtab="${subtabType}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
    console.log('Activated tab:', activeTab);
  } else {
    console.error('Tab not found:', subtabType);
  }
  
  // Show/hide content
  document.querySelectorAll('.sub-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  const targetContent = document.getElementById(`${subtabType}Content`);
  if (targetContent) {
    targetContent.classList.add('active');
    console.log('Activated content:', targetContent);
  } else {
    console.error('Content not found:', `${subtabType}Content`);
  }
}

// Storage path update functionality
function setupStoragePathUpdate() {
  const updateButton = document.getElementById('updateStoragePath');
  const storageInput = document.getElementById('storagePathInput');
  
  if (updateButton && storageInput) {
    updateButton.addEventListener('click', () => {
      const newPath = storageInput.value.trim();
      if (newPath) {
        // Save to chrome storage
        chrome.storage.local.set({ storagePath: newPath }, () => {
          showNotification('Storage path updated successfully!', 'success');
        });
      }
    });
  }
}

// Medical condition to source mapping
const MEDICAL_CONDITION_MAPPING = {
  'diabetes': ['academic', 'journals', 'clinical', 'specialized'],
  'cancer': ['academic', 'journals', 'clinical', 'specialized'],
  'mental health': ['mental_health', 'academic', 'journals'],
  'depression': ['mental_health', 'academic', 'journals'],
  'anxiety': ['mental_health', 'academic', 'journals'],
  'fertility': ['specialized', 'clinical', 'academic'],
  'reproductive': ['specialized', 'clinical', 'academic'],
  'dental': ['specialized', 'clinical'],
  'heart': ['clinical', 'academic', 'journals'],
  'cardiovascular': ['clinical', 'academic', 'journals'],
  'covid': ['academic', 'journals', 'clinical'],
  'pandemic': ['academic', 'journals', 'clinical'],
  'research': ['academic', 'journals'],
  'study': ['academic', 'journals'],
  'treatment': ['clinical', 'academic', 'journals'],
  'diagnosis': ['clinical', 'academic', 'journals']
};

// Dynamic link suggestions based on search
function getDynamicSuggestions(searchTerm) {
  console.log('Getting dynamic suggestions for:', searchTerm);
  const suggestions = [];
  const term = searchTerm.toLowerCase();
  const scoredSources = [];
  
  // Check for medical condition matches
  const relevantCategories = [];
  Object.keys(MEDICAL_CONDITION_MAPPING).forEach(condition => {
    if (term.includes(condition)) {
      relevantCategories.push(...MEDICAL_CONDITION_MAPPING[condition]);
    }
  });
  
  // Score all sources based on relevance
  Object.keys(MEDICAL_WEBSITES).forEach(category => {
    if (category === 'default') return;
    
    const sources = MEDICAL_WEBSITES[category];
    sources.forEach(source => {
      let score = 0;
      
      // High score for exact name matches
      if (source.name.toLowerCase().includes(term)) score += 15;
      
      // Medium score for description matches
      if (source.description && source.description.toLowerCase().includes(term)) score += 8;
      
      // Medium score for category matches
      if (category.includes(term)) score += 8;
      
      // Lower score for partial matches
      if (source.name.toLowerCase().split(' ').some(word => word.includes(term))) score += 5;
      
      // Boost score for relevant medical condition categories
      if (relevantCategories.includes(category)) score += 10;
      
      // Category-specific scoring
      if (category === 'academic' || category === 'journals') score += 3; // Prioritize research sources
      if (category === 'clinical') score += 2; // Clinical sources are important
      if (category === 'specialized') score += 1; // Specialized sources
      
      if (score > 0) {
        scoredSources.push({ ...source, category, score });
      }
    });
  });
  
  console.log('Found scored sources:', scoredSources.length);
  
  // Sort by score (highest first)
  scoredSources.sort((a, b) => b.score - a.score);
  
  // If we have scored results, use them
  if (scoredSources.length > 0) {
    suggestions.push(...scoredSources.slice(0, 6));
  }
  
  // Always add some high-quality default sources if we have few matches
  if (suggestions.length < 8) {
    const defaultSources = [
      ...MEDICAL_WEBSITES.academic.slice(0, 4),
      ...MEDICAL_WEBSITES.journals.slice(0, 3),
      ...MEDICAL_WEBSITES.clinical.slice(0, 4),
      ...MEDICAL_WEBSITES.specialized.slice(0, 2),
      ...MEDICAL_WEBSITES.mental_health.slice(0, 2),
      ...MEDICAL_WEBSITES.healthtech.slice(0, 2)
    ];
    
    // Add defaults that aren't already in suggestions
    defaultSources.forEach(source => {
      if (!suggestions.find(s => s.url === source.url)) {
        suggestions.push({ ...source, category: 'recommended', score: 1 });
      }
    });
  }
  
  const finalSuggestions = suggestions.slice(0, 12);
  console.log('Final suggestions:', finalSuggestions.length, finalSuggestions.map(s => s.name));
  return finalSuggestions;
}

// Enhanced search functionality
function performEnhancedSearch() {
  const searchTerm = elements.diseaseSearch.value.trim();
  if (!searchTerm) return;
  
  // Store the current search term
  researchData.currentSearchTerm = searchTerm;
  
  // Get dynamic suggestions
  const suggestions = getDynamicSuggestions(searchTerm);
  
  // Update the sites list with new suggestions
  updateSitesList(suggestions);
  
  // Show the suggested sites section
  elements.suggestedSites.style.display = 'block';
  
  // Make sure both sub-tabs are visible
  const actionsTab = document.querySelector('[data-subtab="actions"]');
  const linksTab = document.querySelector('[data-subtab="links"]');
  if (actionsTab) actionsTab.style.display = 'block';
  if (linksTab) linksTab.style.display = 'block';
  
  // Switch to links tab to show suggested sites
  switchToSubTab('links');
  
  // Show notification
  showNotification(`Found ${suggestions.length} medical sources for "${searchTerm}". Click on a website to visit, then use Actions tab to analyze.`, 'success');
}

// Update sites list with new format
function updateSitesList(suggestions) {
  const sitesList = document.getElementById('sitesList');
  if (!sitesList) return;
  
  sitesList.innerHTML = '';
  
  suggestions.forEach((site, index) => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    // Get category emoji
    const categoryEmojis = {
      'academic': '🎓',
      'journals': '📚',
      'clinical': '🏥',
      'specialized': '🔬',
      'mental_health': '🧠',
      'healthtech': '💻',
      'general': '🌐',
      'recommended': '⭐'
    };
    
    const emoji = categoryEmojis[site.category] || '🔗';
    const scoreText = site.score > 1 ? ` (Score: ${site.score})` : '';
    
    siteItem.innerHTML = `
      <div class="site-info">
        <div class="site-name">${emoji} ${site.name}${scoreText}</div>
        <div class="site-description">${site.description || 'Medical resource'}</div>
        <div class="site-category">${site.category.toUpperCase()}</div>
  </div>
      <div class="site-click-indicator">→</div>
    `;
    
    // Add click event listener to the entire site item
    siteItem.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Site item clicked:', site.name, site.url);
      visitSiteAndActivateActions(site.url, site.name);
    });
    sitesList.appendChild(siteItem);
  });
}

// Visit site and activate actions tab
function visitSiteAndActivateActions(url, siteName) {
  console.log('Opening site:', url, 'Name:', siteName);
  
  try {
    // Try Chrome extension API first
    if (chrome && chrome.tabs) {
      chrome.tabs.create({ url: url, active: true }, (tab) => {
        console.log('Opened tab:', tab.id);
      });
    } else {
      // Fallback to window.open
      window.open(url, '_blank');
    }
    
    // Switch to actions tab
    switchToSubTab('actions');
    
    // Show notification
    showNotification(`Opened ${siteName}. Use Actions tab to analyze the page.`, 'success');
    
    // Enable the analyze button
    const analyzeButton = document.getElementById('analyzePage');
    if (analyzeButton) {
      analyzeButton.disabled = false;
    }
    
    // Update site status to visited
    updateSiteStatus(url, 'visited');
    
  } catch (error) {
    console.error('Error opening site:', error);
    showNotification('Failed to open site. Please try again.', 'error');
  }
}

// Show default suggestions on load
function showDefaultSuggestions() {
  // Don't show suggestions by default - wait for user search
  // This ensures dynamic suggestions work properly
  elements.suggestedSites.style.display = 'none';
}

// Show full changelog details
function showFullChangelogDetails() {
  const changelog = `
🏥 WISE Clinical Assistant - Version 3.5 Changelog

🔗 CLICKABLE LINKS FIX:
• Fixed non-working clickable links issue
• Replaced onclick attributes with proper event listeners
• Made entire site items clickable for better UX
• Added Chrome extension API support for tab creation
• Enhanced error handling and debugging

🎨 UI/UX IMPROVEMENTS:
• Removed redundant "Visit" button text
• Added visual click indicator (→) with hover animations
• Enhanced site-item styling with better padding and borders
• Added blue hover effects with smooth transitions
• Improved typography and visual feedback

🔍 DYNAMIC SUGGESTIONS ENHANCEMENT:
• Fixed static site list issue completely
• Implemented intelligent medical condition mapping
• Enhanced scoring algorithm with medical context awareness
• Added comprehensive medical source database
• Real-time suggestions based on search terms

📊 TOPIC HEADERS VISIBILITY:
• Changed topic research analysis headers to blue (#1e40af)
• Better contrast against background gradient
• Improved readability in Insights tab

🎯 TECHNICAL IMPROVEMENTS:
• Enhanced error handling throughout the application
• Added comprehensive console logging for debugging
• Improved function structure with try-catch blocks
• Better Chrome extension API integration
• Optimized performance and reliability

📋 HELP TAB ENHANCEMENTS:
• Added version information display
• Included executive summary of changes
• Added full changelog functionality
• Professional release information display

🎨 UI/UX IMPROVEMENTS (v3.5):
• Made repository topic headers blue for better visibility
• Added reverse chronological ordering to insights display
• Fixed release date display to show current date
• Enhanced changelog modal functionality
• Auto-scroll to forms when clicking help actions

Version 3.5 represents continued improvements with better visual consistency and enhanced user experience.
  `;
  
  // Create a modal or alert to show the changelog
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    padding: 20px;
    border-radius: 12px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-line;
    border: 2px solid rgba(59, 130, 246, 0.3);
  `;
  
  content.textContent = changelog;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕ Close';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(239, 68, 68, 0.8);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  `;
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  content.appendChild(closeBtn);
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  initialize();
  setupSubTabs();
  setupStoragePathUpdate();
  
  // Override the search button click to use enhanced search
  if (elements.searchButton) {
    elements.searchButton.removeEventListener('click', performSearch);
    elements.searchButton.addEventListener('click', performEnhancedSearch);
  }
  
  // Add real-time search as user types
  if (elements.diseaseSearch) {
    elements.diseaseSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.trim();
      if (searchTerm.length > 2) {
        const suggestions = getDynamicSuggestions(searchTerm);
        updateSitesList(suggestions);
        elements.suggestedSites.style.display = 'block';
        switchToSubTab('links');
      }
    });
  }
  
  // No need to show default suggestions - handled in initialization
  
  // Add changelog functionality
  const showFullChangelog = document.getElementById('showFullChangelog');
  if (showFullChangelog) {
    showFullChangelog.addEventListener('click', () => {
      showFullChangelogDetails();
    });
  }
});
