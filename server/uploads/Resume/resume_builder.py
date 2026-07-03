import os
import subprocess
import sys

def main():
    print("=======================================")
    print("Welcome to the Resume Builder")
    print("=======================================")
    print("\nPlease select the resume role:")
    print("1. QA Automation Engineer")
    print("2. Software Developer")
    
    choice = input("\nEnter choice (1 or 2): ").strip()
    
    assets_dir = os.path.join(os.getcwd(), "Assets")
    
    if choice == "1":
        print("\nBuilding QA Automation Engineer Resume...")
        try:
            subprocess.run([sys.executable, os.path.join(assets_dir, "build_resume_pdf.py")], check=True)
            subprocess.run([sys.executable, os.path.join(assets_dir, "build_resume.py")], check=True)
            print("\nOpening QA Resume Preview...")
            os.startfile(os.path.join(assets_dir, "resume_preview.html"))
        except Exception as e:
            print(f"Error building QA resume: {e}")
            
    elif choice == "2":
        print("\nBuilding Software Developer Resume...")
        try:
            subprocess.run([sys.executable, os.path.join(assets_dir, "build_sd_resume_pdf.py")], check=True)
            subprocess.run([sys.executable, os.path.join(assets_dir, "build_sd_resume.py")], check=True)
            print("\nOpening Software Developer Resume Preview...")
            os.startfile(os.path.join(assets_dir, "sd_resume_preview.html"))
        except Exception as e:
            print(f"Error building SD resume: {e}")
            
    else:
        print("Invalid choice. Please run the script again and select 1 or 2.")

if __name__ == "__main__":
    main()
