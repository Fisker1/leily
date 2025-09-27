#!/usr/bin/env python3
"""
Script to refine favicon scaling with different factors for different use cases:
- Small icons (browser tabs): Keep current larger scaling (works well)
- Medium to large icons (app icons): Use smaller scaling (1.2-1.3x) to avoid compression look
"""

import os
from PIL import Image, ImageOps

def find_content_bounds(image):
    """Find the bounds of the actual content (non-transparent/non-white areas)"""
    # Convert to RGBA if not already
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Get the bounding box of non-transparent content
    bbox = image.getbbox()
    if bbox is None:
        # If no content found, return the full image bounds
        return (0, 0, image.width, image.height)
    
    return bbox

def enlarge_logo_content(input_path, output_path, scale_factor=1.3, min_padding=2):
    """
    Make the logo content appear larger by scaling it up within the favicon
    
    Args:
        input_path: Path to input image
        output_path: Path to output image
        scale_factor: How much to scale up the content
        min_padding: Minimum padding to maintain around edges
    """
    # Open the image
    img = Image.open(input_path)
    original_size = img.size
    
    # Convert to RGBA for transparency handling
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Find the content bounds
    content_bounds = find_content_bounds(img)
    left, top, right, bottom = content_bounds
    
    # Extract just the content
    content = img.crop(content_bounds)
    content_width = right - left
    content_height = bottom - top
    
    # Calculate new scaled size
    new_content_width = int(content_width * scale_factor)
    new_content_height = int(content_height * scale_factor)
    
    # Make sure the scaled content fits within the original dimensions with minimum padding
    max_width = original_size[0] - (2 * min_padding)
    max_height = original_size[1] - (2 * min_padding)
    
    # Adjust scale if necessary to fit
    if new_content_width > max_width or new_content_height > max_height:
        width_scale = max_width / content_width
        height_scale = max_height / content_height
        actual_scale = min(width_scale, height_scale)
        
        new_content_width = int(content_width * actual_scale)
        new_content_height = int(content_height * actual_scale)
        print(f"  Adjusted scale to {actual_scale:.2f} to fit within bounds")
    
    # Scale up the content with high-quality resampling
    scaled_content = content.resize((new_content_width, new_content_height), Image.Resampling.LANCZOS)
    
    # Create a new image with the original size and transparent background
    new_img = Image.new('RGBA', original_size, (0, 0, 0, 0))
    
    # Calculate position to paste the scaled content (centered)
    paste_x = (original_size[0] - new_content_width) // 2
    paste_y = (original_size[1] - new_content_height) // 2
    
    # Paste the scaled content onto the new image
    new_img.paste(scaled_content, (paste_x, paste_y), scaled_content)
    
    # Save the result
    new_img.save(output_path, 'PNG')
    print(f"Processed {input_path} -> {output_path}")
    print(f"  Original content: {content_width}x{content_height}")
    print(f"  Scaled content: {new_content_width}x{new_content_height}")
    print(f"  Scale factor: {new_content_width/content_width:.2f}x")

def refine_favicon_scaling():
    """Process favicon files with refined scaling factors"""
    favicon_files = [
        # Small icons (browser tabs) - keep current scaling as it works well
        ('public/favicon-16x16.png', 'public/favicon-16x16.png', 1.5, "Small (browser tab)"),  # Keep current
        ('public/favicon.png', 'public/favicon.png', 1.4, "Small-medium (browser tab)"),  # Keep current
        ('public/favicon-32x32.png', 'public/favicon-32x32.png', 1.4, "Small-medium (browser tab)"),  # Keep current
        
        # Medium icons (app icons) - reduce scaling to avoid compression look
        ('public/apple-touch-icon-76x76.png', 'public/apple-touch-icon-76x76.png', 1.2, "Medium (app icon)"),
        ('public/apple-touch-icon-120x120.png', 'public/apple-touch-icon-120x120.png', 1.2, "Medium (app icon)"),
        ('public/apple-touch-icon-152x152.png', 'public/apple-touch-icon-152x152.png', 1.2, "Medium (app icon)"),
        ('public/apple-touch-icon-180x180.png', 'public/apple-touch-icon-180x180.png', 1.2, "Medium (app icon)"),
        
        # Large icons (app icons) - reduce scaling significantly to avoid compression look
        ('public/leily-icon-192.png', 'public/leily-icon-192.png', 1.25, "Large (app icon)"),
        ('public/leily-icon-512.png', 'public/leily-icon-512.png', 1.3, "Large (app icon)"),
    ]
    
    for input_file, output_file, scale, description in favicon_files:
        if os.path.exists(input_file):
            print(f"\nProcessing {input_file} with {scale}x scale ({description})...")
            enlarge_logo_content(input_file, output_file, scale_factor=scale, min_padding=2)
        else:
            print(f"Warning: {input_file} not found")
    
    # Also recreate favicon.ico from the updated PNG
    if os.path.exists('public/favicon.png'):
        print(f"\nRecreating favicon.ico from updated favicon.png...")
        img = Image.open('public/favicon.png')
        img.save('public/favicon.ico', format='ICO', sizes=[(32, 32), (16, 16)])
        print("Created public/favicon.ico")

if __name__ == "__main__":
    print("Refining favicon scaling with optimized factors for different use cases...")
    print("- Small icons (browser tabs): Keep current scaling")
    print("- Medium/Large icons (app icons): Reduce to 1.2-1.3x to avoid compression look")
    refine_favicon_scaling()
    print("\nDone! Favicon scaling refined for optimal appearance in different contexts.")