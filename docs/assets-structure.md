# Assets Structure Documentation

## Overview
This document describes the organization of assets in the Leily project.

## Directory Structure

### `/src/assets/`
Main assets directory containing all static files used by the application.

#### `/src/assets/chatgpt-assets/`
**Purpose**: Contains all ChatGPT-generated logo files and brand assets.

**Files**:
- `ChatGPT Image 11. sep. 2025, 03_21_54.png` - Original ChatGPT logo variant 1
- `ChatGPT Image 11. sep. 2025, 03_21_58.png` - Original ChatGPT logo variant 2  
- `ChatGPT Image Sep 24, 2025, 04_26_30 PM.png` - Updated ChatGPT logo variant 3
- `ChatGPT Image Sep 25, 2025, 03_29_09 PM.png` - **Current primary logo** (used in email templates)
- `png_croppet.png` - Cropped version of logo

**Usage**: 
- The primary logo (`ChatGPT Image Sep 25, 2025, 03_29_09 PM.png`) is embedded as base64 in email templates
- Other variants are available for different use cases (web, print, etc.)

#### Other Assets
- `demo-house-*.jpg` - Demo property images
- `demo-property-*.jpg` - Demo property images  
- `hero-image.jpg` - Main hero section image
- `leily_correct_favicon.png` - Website favicon
- `lofoten-apartment.jpg` - Property showcase image
- `rental-map-example.png` - Map example for rental listings
- `video-placeholder.jpg` - Placeholder for video content

## Email Template Integration

The ChatGPT-generated logo is embedded directly in email templates as base64 data URLs to ensure:
- Emails display correctly across all email clients
- No external dependencies or broken image links
- Consistent branding in all email communications

## Best Practices

1. **Logo Updates**: When updating the primary logo, ensure to:
   - Update the base64 encoding in email templates
   - Test across different email clients
   - Maintain aspect ratio and quality

2. **Asset Organization**: 
   - Keep ChatGPT-generated assets in the dedicated folder
   - Use descriptive filenames with timestamps
   - Maintain both original and processed versions

3. **Performance**: 
   - Optimize images for web use
   - Consider using WebP format for web assets
   - Keep email-embedded images under 100KB when possible

## Future Improvements

- Consider implementing a logo management system
- Add automated base64 conversion for email templates
- Implement responsive logo variants for different screen sizes
