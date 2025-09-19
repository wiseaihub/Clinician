# WISE Clinical Research Assistant Chrome Extension

An advanced Chrome extension designed to transform clinical research workflows for healthcare professionals. This comprehensive tool provides intelligent website suggestions, AI-powered analysis, and local data management for building a personal clinical knowledge base.

## 🏥 Overview

The WISE Clinical Research Assistant is a sophisticated browser extension that revolutionizes how clinicians and healthcare professionals conduct medical research online. Built with advanced AI integration and intelligent data management, it provides a complete research workflow from initial topic search to comprehensive insights analysis.

## ✨ Enhanced Features (Version 2.0)

### 🔍 **Intelligent Research Workflow**
- **Disease/Symptom Search**: Enter medical topics to get curated website suggestions
- **Smart Website Suggestions**: AI-powered recommendations based on medical categories
- **URL Status Tracking**: Visual indicators for visited/analyzed/saved websites
- **Search Persistence**: Maintains search context across browser sessions

### 📚 **Advanced Data Management**
- **Research Repository**: Save and organize clinical findings locally
- **Local File Storage**: Export research data to 'WISE Clinician Assistant' folder
- **Topic Management**: Organize research by medical topics with statistics
- **Cross-Platform**: Works seamlessly on Windows, Mac, and Linux

### 📊 **Research Insights & Analysis**
- **Topic-Based Analysis**: Comprehensive insights organized by medical conditions
- **Treatment Variations**: Analysis of conflicting/alternative treatment approaches
- **Demographic Variations**: Regional, social, and economic factor analysis
- **AI Confidence Scoring**: Confidence levels for diagnosis, treatment, and efficacy
- **CDSS Integration**: Recommendations for Clinical Decision Support System integration

### 🎨 **Professional User Experience**
- **WISE Brand Colors**: Professional medical interface with brand-consistent styling
- **Responsive Design**: Larger window (800x600) with tabbed interface
- **Real-time Notifications**: User feedback for all actions
- **Email Integration**: Direct feedback system to wiseaihub@gmail.com

## 🚀 Installation

### From Source (Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/wiseaihub/Clinician.git
   cd Clinician
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the project directory
   - The extension will appear in your Chrome toolbar

### From Chrome Web Store
*Coming soon - extension will be published to the Chrome Web Store*

## 📁 Project Structure

```
Clinical_Context_Assistant/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── styles.css            # Styling for the popup
├── images/               # Extension icons and assets
│   ├── icon16.png        # 16x16 extension icon
│   ├── icon32.png        # 32x32 extension icon
│   ├── icon48.png        # 48x48 extension icon
│   └── favicon_io/       # Additional favicon assets
└── README.md             # This file
```

## 🛠️ Development

### Prerequisites
- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Building
No build process required - this is a vanilla JavaScript extension that runs directly in the browser.

## 📋 Enhanced Usage Workflow

### **Step 1: Research Initiation**
1. **Enter Medical Topic**: Type disease, symptom, or condition in the search box
2. **Click Search Button**: Get intelligent website suggestions
3. **Browse Suggested Sites**: Click on curated medical websites

### **Step 2: Analysis & Data Collection**
1. **Analyze Current Page**: Click "Analyze Current Page" for AI insights
2. **Review Results**: Get comprehensive clinical analysis with confidence levels
3. **Save to Repository**: Click "Add to Research Repo" to save valuable findings

### **Step 3: Research Management**
1. **View Repository**: See all saved research organized by topic (newest first)
2. **Generate Insights**: Switch to Insights tab for comprehensive analysis
3. **Export Reports**: Download HTML reports for offline review

### **Step 4: Advanced Features**
1. **Settings Configuration**: Enable local storage and CDSS wishlist
2. **Feedback System**: Report bugs, request features, or join beta program
3. **Cross-Session Persistence**: Search terms and progress maintained across browser sessions

## 🔧 Configuration

The extension can be configured through the `manifest.json` file:

- **Version**: Current extension version
- **Permissions**: Required browser permissions
- **Icons**: Extension icons for different sizes
- **Popup**: Main interface configuration

## 📝 Version History

### v2.0.0 (Current) - Enhanced Clinical Research Assistant
- **Intelligent Research Workflow**: Disease/symptom search with website suggestions
- **Advanced Data Management**: Research repository with local storage
- **Comprehensive Insights**: Topic-based analysis with treatment variations
- **Professional UI**: WISE brand colors and responsive design
- **Email Integration**: Direct feedback system
- **Cross-Session Persistence**: Search terms and progress maintained
- **CDSS Integration**: Clinical Decision Support System recommendations

### v1.0.0 (Baseline)
- Initial release with basic popup interface
- Clinical context assistant functionality
- Chrome extension manifest v3 compatibility

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style
- Add comments for complex functionality
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏥 Medical Disclaimer

**Important**: This extension is designed to assist healthcare professionals but should not replace professional medical judgment, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.

## 📞 Support

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/wiseaihub/Clinician/issues)
- **Documentation**: Check the [Wiki](https://github.com/wiseaihub/Clinician/wiki) for detailed documentation
- **Contact**: Reach out to the development team for support

## 🙏 Acknowledgments

- Healthcare professionals who provided feedback
- Medical community for clinical guidelines and references
- Open source community for tools and libraries

---

**Assignment 1 - Baseline Code**  
This repository contains the baseline code for Assignment 1 of the Clinical Context Assistant project.

**Repository**: [https://github.com/wiseaihub/Clinician](https://github.com/wiseaihub/Clinician)  
**Author**: wiseaihub  
**Last Updated**: September 2025
