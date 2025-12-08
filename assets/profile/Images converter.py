import os
from PIL import Image
import sys

# Configuration
TARGET_FORMAT = 'webp'  # Can be 'webp'
QUALITY = 80            # 0 to 100. 80 is a great balance of size/quality.
# Files with these extensions will be converted
SUPPORTED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}

def get_size_format(b, factor=1024, suffix="B"):
    """Scale bytes to its proper byte format (e.g., 10MB)"""
    for unit in ["", "K", "M", "G", "T"]:
        if b < factor:
            return f"{b:.2f}{unit}{suffix}"
        b /= factor
    return f"{b:.2f}P{suffix}"

def optimize_images(root_dir):
    print(f"🚀 Starting optimization in: {root_dir}")
    print(f"🎯 Target Format: {TARGET_FORMAT.upper()} | Quality: {QUALITY}")
    print("-" * 50)

    saved_space = 0
    files_converted = 0
    errors = 0

    # Walk through all directories and subdirectories
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            # Get file extension in lowercase
            file_path = os.path.join(subdir, file)
            name, ext = os.path.splitext(file)
            ext = ext.lower()

            # Skip if it's already the target format or not an image
            if ext not in SUPPORTED_EXTENSIONS:
                continue
            
            # Skip if the target file already exists (to prevent re-processing)
            # e.g. if we have image.jpg, we don't want to process it if image.webp exists
            target_file_path = os.path.join(subdir, f"{name}.{TARGET_FORMAT}")
            if os.path.exists(target_file_path) and target_file_path != file_path:
                # Optional: You might want to skip here, or continue to overwrite.
                # We will proceed to overwrite.
                pass

            try:
                # 1. Open the image
                with Image.open(file_path) as img:
                    original_size = os.path.getsize(file_path)

                    # 2. Handle transparency for PNGs when converting to formats that might lose it
                    # WebP handles RGBA (transparency) fine, so we generally don't need to convert to RGB 
                    # unless using a format that doesn't support it.
                    
                    # 3. Save as new format
                    # 'optimize=True' attempts to compress further without quality loss
                    img.save(target_file_path, TARGET_FORMAT, quality=QUALITY, optimize=True)

                # 4. Check new size
                new_size = os.path.getsize(target_file_path)
                
                # Calculate space saved
                space_diff = original_size - new_size
                saved_space += space_diff
                files_converted += 1

                print(f"✅ Converted: {file} -> {os.path.basename(target_file_path)}")
                print(f"   Saved: {get_size_format(space_diff)} ({(space_diff/original_size)*100:.1f}%)")

                # 5. DELETE ORIGINAL FILE
                # Ensure we don't delete the file we just created
                if file_path != target_file_path:
                    os.remove(file_path)

            except Exception as e:
                print(f"❌ Error processing {file}: {e}")
                errors += 1

    print("-" * 50)
    print("✨ Optimization Complete")
    print(f"🖼️  Images Processed: {files_converted}")
    print(f"💾 Total Space Saved: {get_size_format(saved_space)}")
    print(f"⚠️ Errors encountered: {errors}")

if __name__ == "__main__":
    # Get the directory where the script is currently running
    current_directory = os.getcwd()
    
    confirm = input(f"This will overwrite images in {current_directory} and all subfolders. Type 'yes' to proceed: ")
    if confirm.lower() == 'yes':
        optimize_images(current_directory)
    else:
        print("Operation cancelled.")