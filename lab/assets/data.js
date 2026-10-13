/*
 * ---------------------------------------------------------------------------
 *  PORTFOLIO CONTENT — edit this file to update the home page.
 *  Everything on index.html (projects, skills, experience, interests, links)
 *  is rendered from this object. Case-study pages live in /projects/*.html.
 *
 *  Sources used so far: github.com/sowmiah08 READMEs and notebooks, the
 *  AppleDetection notebook you pointed to, and your public Twine profile
 *  (for education / internship — please double-check against LinkedIn).
 * ---------------------------------------------------------------------------
 */
window.PORTFOLIO = {
  name: 'Sowmiya Jeromiah',
  role: 'Robotics Engineer',
  location: 'Bristol, UK',

  links: {
    linkedin: 'https://www.linkedin.com/in/sowmiya-jeromiah/',
    github: 'https://github.com/sowmiah08',
    email: '',          // e.g. 'you@example.com' — the Email button appears only when this is set
    cv: ''              // e.g. '../media/Sowmiya_Jeromiah_CV.pdf' — the CV button appears only when this is set
  },

  /* status: 'completed' | 'ongoing' | 'planned' */
  projects: [
    {
      slug: 'visionnassembly',
      featured: true,
      title: 'visionNassembly',
      kind: 'Simulation · Dual-arm assembly',
      status: 'completed',
      statusNote: 'Working demo in simulation',
      summary: 'Two SO-101 arms use an overhead RGB-D camera to find parts on a table, estimate their 6-DoF pose and assemble them: a 4-pin plug into a socket and a peg into a plate. It recovers from failures on its own.',
      contribution: 'Solo project: perception pipeline (depth segmentation, SAM 2 masks, model fitting), MoveIt 2 assembly with recovery, data-driven part library and a randomised evaluation harness.',
      metrics: [['11/12', 'randomised trials'], ['≈1 mm', 'pose error'], ['1.2 mm', 'mean insertion error']],
      stack: ['ROS 2 Jazzy', 'Gazebo Harmonic', 'MoveIt 2', 'SAM 2.1', 'Open3D', 'Python'],
      media: { type: 'video', src: '../media/visionNassembly.mp4', poster: '../media/visionNassembly.jpg', alt: 'Gazebo simulation: overhead camera view, SAM 2 masks and ground truth, then the arm inserting a part' },
      repo: 'https://github.com/sowmiah08/visionNassembly',
      caseStudy: 'projects/visionnassembly.html'
    },
    {
      slug: 'pick-and-place',
      title: 'Autonomous pick & place on SO-101',
      kind: 'Real hardware · Manipulation',
      status: 'completed',
      statusNote: 'Running on hardware · dual-arm hand-off planned',
      summary: 'A real SO-101 arm detects coloured cubes in a RealSense point cloud, plans a top-down grasp with MoveIt 2, picks, lifts and returns home, then repeats with no human input.',
      contribution: 'HSV + DBSCAN cube detector, TF2 frame transforms, async MoveIt state machine and the servo bridge to the real arm.',
      stack: ['ROS 2', 'MoveIt 2', 'RealSense', 'DBSCAN', 'TF2'],
      media: { type: 'video', src: '../media/pick-and-place.mp4', poster: '../media/pick-and-place.jpg', alt: 'RViz with point cloud and MoveIt plan next to the real SO-101 arm picking a cube' },
      repo: 'https://github.com/sowmiah08/precision_pick_and_place_with_inverse_kinematics',
      caseStudy: 'projects/pick-and-place.html'
    },
    {
      slug: 'hand-teleop',
      title: 'Hand-guided teleoperation',
      kind: 'Real hardware · HRI',
      status: 'completed',
      statusNote: 'Working on hardware',
      summary: 'Point a finger at a depth camera and the SO-ARM100 follows. MediaPipe finds the fingertip, depth lifts it into 3D, an AprilTag gives the camera-to-robot transform and LeRobot IK drives the arm.',
      contribution: 'ROS 2 packages for hand tracking, pixel-to-3D back-projection, AprilTag-based TF and the IK controller with safety limits.',
      stack: ['ROS 2', 'MediaPipe', 'AprilTag', 'LeRobot'],
      media: { type: 'video', src: '../media/hand-teleop.mp4', poster: '../media/hand-teleop.jpg', thumb: '../media/hand-teleop-thumb.jpg', videoPosition: 'center top', alt: 'Hand tracking window with fingertip landmarks while the real arm follows the hand', position: 'center' },
      repo: 'https://github.com/sowmiah08/hand_based_manipulation',
      caseStudy: 'projects/hand-teleop.html'
    },
    {
      slug: 'apple-detection',
      title: 'Apple detection for yield estimation',
      kind: 'Agri-robotics · Deep learning',
      status: 'completed',
      statusNote: 'Trained & exported to ONNX',
      summary: 'Detects and counts apples in orchard images. Three datasets combined, masks and COCO labels converted to YOLO, YOLOv8 and YOLO11 trained and compared.',
      contribution: 'Dataset preparation, YOLOv8 / YOLO11 training and evaluation, ONNX export for CPU inference.',
      metrics: [['0.853', 'mAP@50'], ['6,172', 'val apples'], ['4.4 ms', 'per image']],
      stack: ['YOLO11', 'YOLOv8', 'OpenCV', 'ONNX'],
      media: { type: 'image', src: '../media/apple-orchard.jpg', alt: 'Orchard with yellow apples, each inside a detection box', position: 'center 30%' },
      repo: 'https://github.com/sowmiah08/Apple-Detection-Machine-Vision',
      caseStudy: 'projects/apple-detection.html'
    },
    {
      slug: 'rrr-control',
      title: 'RRR end-effector control',
      kind: 'Control · Simulation',
      status: 'completed',
      statusNote: 'Internship challenge',
      summary: 'A 3-DOF planar arm tracks a moving target with closed-form inverse kinematics and PID joint control, and avoids an obstacle using a repulsive force field. Runs in Docker.',
      contribution: 'IK solver, PID controller, obstacle repulsion and the Dockerised simulation.',
      stack: ['Python', 'NumPy', 'Matplotlib', 'Docker'],
      media: { type: 'image', src: '../media/rrr-sim_obs.png', alt: 'Plot of the arm’s end-effector path bending around a red obstacle', light: true },
      repo: 'https://github.com/sowmiah08/Robot_EndEffector_Control',
      caseStudy: 'projects/rrr-control.html'
    }
  ],

  /* Smaller work without a demo visual — listed compactly under the grid. */
  otherWork: [
    { title: 'Counting rolls leaving a production line', kind: 'Industrial vision · Tracking', status: 'completed',
      summary: 'Fine-tuned YOLO11 detector (mAP50 0.99) with a custom tracker that counts each roll once, only when a tray carries it off the line.',
      stack: ['YOLO11', 'Tracking', 'OpenCV'], note: 'Take-home · code private' },
    { title: 'Brain-stroke detection from CT scans', kind: 'Medical imaging · Deep learning', status: 'completed',
      summary: 'EfficientNet-based classifier for brain-stroke detection from CT images.',
      stack: ['EfficientNet', 'Python'], repo: 'https://github.com/sowmiah08/EfficientNet-Brain-Stroke-Detection' },
    { title: 'Résumé classification', kind: 'NLP · Machine learning', status: 'completed',
      summary: 'Résumé classification using LightGBM and sentiment analysis.',
      stack: ['LightGBM', 'NLP'], repo: 'https://github.com/sowmiah08/resume-classification-LGBM-Sentiment' }
  ],

  /* Only skills evidenced in the projects above. Add or remove freely. */
  skills: [
    { group: 'Robotics', items: ['ROS 2 (Jazzy)', 'MoveIt 2', 'TF2', 'ros2_control', 'URDF / Xacro', 'Inverse kinematics', 'PID control', 'Potential fields', 'LeRobot'] },
    { group: 'Perception & vision', items: ['RGB-D / point clouds', '6-DoF pose estimation', 'Open3D', 'OpenCV', 'SAM 2', 'YOLO (v8, 11)', 'MediaPipe', 'AprilTag', 'DBSCAN', 'Object tracking'] },
    { group: 'Simulation & hardware', items: ['Gazebo Harmonic', 'RViz', 'Intel RealSense', 'SO-101 / SO-ARM100', 'Feetech servos'] },
    { group: 'Machine learning', items: ['PyTorch', 'Ultralytics', 'ONNX', 'TensorFlow / Keras', 'LightGBM'] },
    { group: 'Software & tools', items: ['Python', 'C++', 'Docker / Compose', 'Linux / Ubuntu', 'Git', 'CUDA', 'Google Colab', 'Roboflow'] }
  ],

  /* From your public Twine profile — verify dates & titles against LinkedIn. */
  experience: [
    { when: '2024 — 2025', type: 'Education', title: 'MSc Robotics Engineering', org: 'University of Bristol & UWE Bristol',
      detail: 'Perception-driven manipulation, motion planning and autonomous systems.' },
    { when: 'Feb — Apr 2023', type: 'Internship', title: 'Applied ML & Robotics Intern', org: 'Enlight Wisdom',
      detail: 'Deep-learning models for computer vision and robotics, autonomous-systems research, and signal-processing pipelines for sensor data.' },
    { when: '2020 — 2024', type: 'Education', title: 'BTech Computer Science (AI/ML)', org: 'SRM Institute of Science and Technology, Chennai',
      detail: 'Specialised in artificial intelligence and machine learning.' }
    // Certifications / awards: add items here, e.g.
    // { when: '2025', type: 'Certification', title: '…', org: '…', detail: '…' }
  ],

  /* Taken from the "next steps" in your own READMEs. */
  interests: {
    now: [
      { title: 'Active perception', detail: 'Using wrist cameras to take a second look at parts the overhead camera can’t see (visionNassembly).' },
      { title: 'Rigorous evaluation', detail: 'Larger randomised trials, error sweeps and randomised targets, so results are numbers rather than demos.' }
    ],
    next: [
      { title: 'Dual-arm hand-off', detail: 'Bringing the second SO-101 arm into MoveIt for a cube hand-off between arms.' },
      { title: 'Place, not just pick', detail: 'Defined placement targets and queues of multiple objects for sequential picking.' }
    ]
  }
};
