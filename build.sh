#!/bin/bash

# 1. Install required packages
yay -S android-sdk android-sdk-platform-tools android-sdk-build-tools android-sdk-cmdline-tools-latest sdkmanager

# 2. Set permissions
sudo chown -R $USER:$USER /opt/android-sdk
sudo chmod -R 755 /opt/android-sdk

# 3. Set environment variables
echo 'export ANDROID_HOME=/opt/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# 4. Accept licenses and install SDK components
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 5. Build APK
if [ -d "frontend/area-front/android" ]; then
  cd frontend/area-front/android
  if [ -f "gradlew" ]; then
    chmod +x gradlew
    ./gradlew clean
    ./gradlew assembleDebug
  else
    echo "gradlew file not found."
    exit 1
  fi
else
  echo "Directory frontend/area-front/android not found."
  exit 1
fi