# Android phone as a webcam on Linux

> **_NOTE:_**  I tested this project and it started working but forgot to document at the time, this readme is a bit out-dated because it doesn't have the ssl setup guide.


So the way it works is that the phone sends the stream on the LAN to the computer and the computer registers a virtual webcam and uses `ffmpeg` to read the stream through websocket and feed to the virtual webcam device and tata you have a phone as a webcam. 

1. **Verify `v4l2loopback` Module:**
   - Ensure the `v4l2loopback` module is loaded correctly with the appropriate options.

2. **Check Virtual Webcam Device:**
   - Verify that the virtual webcam device (`/dev/video0`) is correctly set up and recognized by the system.

3. **Adjust `ffmpeg` Command:**
   - Ensure the `ffmpeg` command is correctly configured to write to the virtual webcam device.

### Step 1: Verify `v4l2loopback` Module

1. **Unload the `v4l2loopback` Module (if already loaded):**

   ```sh
   sudo modprobe -r v4l2loopback
   ```

2. **Load the `v4l2loopback` Module with Correct Options:**

   ```sh
   sudo modprobe v4l2loopback devices=1 video_nr=0 card_label="VirtualCam" exclusive_caps=1
   ```

### Step 2: Check Virtual Webcam Device

1. **Check if the Virtual Webcam Device Exists:**

   ```sh
   ls -l /dev/video0
   ```

   You should see an entry for `/dev/video0`.

2. **Check the Device Capabilities:**

   ```sh
   v4l2-ctl --all -d /dev/video0
   sudo usermod -aG video $USER
   ```

   This command should display information about the virtual webcam device.

### Step 3: Adjust `ffmpeg` Command

1. **Ensure the `ffmpeg` Command is Correctly Configured:**

   ```sh
   ffmpeg -re -i video_pipe -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video0
   ```

   for better perfomance
   
   ```sh
   ffmpeg -re -i video_pipe -preset ultrafast -tune zerolatency -f v4l2 -vcodec rawvideo -pix_fmt yuv420p /dev/video0
   ```

### step 4: running the servers

1. **Run the `https_server.js` server:**
   
   The `https_server.js` server is responsible for serving the HTML and JavaScript files to the client (phone).

   ```sh
   node https_server.js
   ```

2. **Run the `websocket_server.js` server:**
      
      The `websocket_server.js` server is responsible for the websocket connection and receiving the video stream from the client (phone) and writing it to the `video_pipe` FIFO.
   
      ```sh
      node websocket_server.js
      ```

### step 5: connecting the phone

The phone should be connected to the same network i.e. LAN and for webcame use open the browser in the mobile phone and enter the ip address of the machine where these server code (where you want the plug it as a webcam) is running with the port as well. And once the connection is established you should be good to go. Lastly, The browser will ask for camera permissions.
