import { AdaptationChannel, ByteDefinition, FecCode, RetrofitRecipe, SfdTokenInfo, VehicleProfile } from '../types/mib3';

export const VEHICLE_PROFILES: VehicleProfile[] = [
  {
    id: 'golf8_gti',
    name: 'Volkswagen Golf 8 GTI / R (CD1)',
    brand: 'Volkswagen',
    platform: 'MQB-evo',
    headunitType: 'MIB3 High (Harman)',
    vinSample: 'WVWZZZCDZMW019284',
    firmwareVersion: 'MOI3_EU_VW_R8410L',
    // 32-byte default coding string (hex formatted)
    defaultCoding: '033300240000000053110001000808001F010004012004008000000000000000'
  },
  {
    id: 'audi_a3_8y',
    name: 'Audi A3 / S3 / RS3 (8Y)',
    brand: 'Audi',
    platform: 'MQB-evo',
    headunitType: 'MIB3GP (Audi MMI)',
    vinSample: 'WAUZZZGY5MA041289',
    firmwareVersion: 'MHI3_ER_AU_P3620',
    defaultCoding: '013300240000000053120002000808002E020004012004008000000000000000'
  },
  {
    id: 'cupra_formentor',
    name: 'Cupra Formentor VZ / VZ5 (KM7)',
    brand: 'Cupra',
    platform: 'MQB-evo',
    headunitType: 'MIB3 High (Harman)',
    vinSample: 'VSSZZZKMZNR081923',
    firmwareVersion: 'MOI3_EU_SE_R8900L',
    defaultCoding: '043300240000000053140001000808003A030004012004008000000000000000'
  },
  {
    id: 'skoda_octavia4',
    name: 'Skoda Octavia IV vRS (NX)',
    brand: 'Skoda',
    platform: 'MQB-evo',
    headunitType: 'MIB3 Standard (Aptiv/Delphi)',
    vinSample: 'TMBJJ9NX8M0112349',
    firmwareVersion: 'MOI3_EU_SK_R8140L',
    defaultCoding: '0533002400000000531300010008080018010004012004008000000000000000'
  },
  {
    id: 'audi_rs6_c8',
    name: 'Audi RS6 Avant / RS7 (C8 / 4K)',
    brand: 'Audi',
    platform: 'MLB-evo',
    headunitType: 'MIB3GP (Audi MMI)',
    vinSample: 'WAUZZZF26NA098124',
    firmwareVersion: 'MHI3_ER_AUG45S_P3853',
    defaultCoding: '013400280000000053120004000808004B050004012004008000000000000000'
  },
  {
    id: 'porsche_macan3',
    name: 'Porsche Macan III / PCM 6.0',
    brand: 'Porsche',
    platform: 'MSB',
    headunitType: 'MIB3 High (Harman)',
    vinSample: 'WP1ZZZ95ZNL034812',
    firmwareVersion: 'MH2p_ER_POG35_P2656',
    defaultCoding: '063300280000000053150004000808005A060004012004008000000000000000'
  }
];

export const MIB3_BYTE_DEFINITIONS: ByteDefinition[] = [
  {
    byteIndex: 0,
    name: 'Brand & Manufacturer Identification',
    category: 'Brand & Platform',
    description: 'Defines the OEM brand firmware personality, boot security profile, and bus identifier.',
    bits: [
      { bit: 0, name: 'Brand Bit 0', description: 'Brand selector LSB (01=Audi, 03=VW, 04=Seat/Cupra, 05=Skoda, 06=Porsche)' },
      { bit: 1, name: 'Brand Bit 1', description: 'Brand selector bit 1' },
      { bit: 2, name: 'Brand Bit 2', description: 'Brand selector bit 2' },
      { bit: 3, name: 'Brand Bit 3', description: 'Brand selector MSB' },
      { bit: 4, name: 'Market Spec', description: '0=ECE (Europe), 1=NAR (North America)' },
      { bit: 5, name: 'Market Spec Asian', description: '1=RoW / China / Japan' },
      { bit: 6, name: 'Component Protection Class', description: 'CP Handshake Mode 2.0 active' },
      { bit: 7, name: 'Diagnostic Protocol', description: 'UDS over CAN-FD / DoIP Ethernet' }
    ]
  },
  {
    byteIndex: 1,
    name: 'Body Variant & Platform Layout',
    category: 'Brand & Platform',
    description: 'Vehicle architecture family: MQB-evo, MLB-evo, MEB, or MSB.',
    bits: [
      { bit: 0, name: 'Body Variant Bit 0', description: 'Sedan / Hatchback / SUV profile' },
      { bit: 1, name: 'Body Variant Bit 1', description: 'Estate / Avant / Shooting Brake' },
      { bit: 2, name: 'Wheelbase Profile', description: '0=Standard, 1=Long Wheelbase (LWB)' },
      { bit: 3, name: 'Steering Orientation', description: '0=LHD (Left Hand Drive), 1=RHD (Right Hand Drive)' },
      { bit: 4, name: 'Platform Family 0', description: 'Architecture matrix bit' },
      { bit: 5, name: 'Platform Family 1', description: 'MQB-evo bus protocol active' },
      { bit: 6, name: 'Trailer Hitch Logic', description: 'Trailer maneuvering camera assistance' },
      { bit: 7, name: 'Panoramic Roof Sunblind', description: 'Sunblind integration in vehicle menu' }
    ]
  },
  {
    byteIndex: 2,
    name: 'Antenna & Reception Configuration',
    category: 'System',
    description: 'FM / AM / DAB+ tuner input amplification and phantom power feeds.',
    bits: [
      { bit: 0, name: 'AM Tuner Input', description: 'Active AM antenna circuitry' },
      { bit: 1, name: 'FM Phase Diversity', description: 'Dual FM tuner phase diversity module' },
      { bit: 2, name: 'DAB+ Digital Radio', description: 'DAB Band III tuner active' },
      { bit: 3, name: 'DAB-FM Seamless Linking', description: 'Service Following audio crossfade' },
      { bit: 4, name: 'GNSS GPS/GLONASS/Galileo', description: 'Navigation antenna phantom power' },
      { bit: 5, name: 'TMC / TMC Pro Traffic', description: 'Broadcast traffic message channel' },
      { bit: 6, name: 'SIRIUS / XM Satellite', description: 'NAR satellite radio receiver' },
      { bit: 7, name: 'Cellular LTE / 5G Diversity', description: 'C-V2X & eSIM antenna module' }
    ]
  },
  {
    byteIndex: 3,
    name: 'Sound System & DSP Architecture',
    category: 'Audio',
    description: 'Specifies internal 4-channel power amplifier vs external MOST150 / A2B DSP amplifier.',
    bits: [
      { bit: 0, name: 'External DSP Most/A2B', description: '0=Internal Amp (Standard 4x20W), 1=External DSP Amp' },
      { bit: 1, name: 'Center Speaker Channel', description: 'Dedicated center channel acoustic feed' },
      { bit: 2, name: 'Subwoofer Channel', description: 'Independent subwoofer gain slider in MMI/MIB menu' },
      { bit: 3, name: 'Bang & Olufsen 3D / Canton', description: '3D Sound / Focus algorithms enabled' },
      { bit: 4, name: 'Microphone Feedback Loop', description: 'ANC (Active Noise Cancellation) engine' },
      { bit: 5, name: 'Acoustic Sound Chimes', description: 'Turn signal & warning chime generator on 5F' },
      { bit: 6, name: 'Equalizer Bands', description: '0=3-Band EQ, 1=Graphic 5/7-Band Parametric EQ' },
      { bit: 7, name: 'Harman Kardon / Beats Audio', description: 'Branded audio DSP profile and splash screen' }
    ]
  },
  {
    byteIndex: 4,
    name: 'Central Display Panel & LVDS Resolution',
    category: 'Display & UI',
    description: 'Hardware LVDS serializer link, touchscreen resolution, and aspect ratio.',
    bits: [
      { bit: 0, name: 'Display Size Bit 0', description: '0=8.25" / 10", 1=12.9" / 15" High-Res display' },
      { bit: 1, name: 'Display Size Bit 1', description: 'Display controller aspect scaling' },
      { bit: 2, name: 'Touch Controller Protocol', description: '0=Synaptics I2C, 1=NextGen USB-HID' },
      { bit: 3, name: 'Haptic Feedback / Force Touch', description: 'Acoustic click & haptic vibration pulse' },
      { bit: 4, name: 'Proximity Sensor Gesture', description: 'Infrared sensor hand detection menu expand' },
      { bit: 5, name: 'Touch Slider Backlight', description: 'Illuminated climate/volume slider bar sync' },
      { bit: 6, name: 'Secondary Passenger Display', description: 'Passenger side auxiliary screen (Porsche/Audi)' },
      { bit: 7, name: 'OLED / Mini-LED Mode', description: 'Deep black ambient contrast tuning' }
    ]
  },
  {
    byteIndex: 5,
    name: 'USB Interface & Power Delivery Profiles',
    category: 'Connectivity',
    description: 'USB-C hub configuration, Apple MFi authentication chip, and Fast Charging protocols.',
    bits: [
      { bit: 0, name: 'USB Port 1 Active', description: 'Front USB-C data & charging enabled' },
      { bit: 1, name: 'USB Port 2 Active', description: 'Console secondary USB-C port' },
      { bit: 2, name: 'Apple MFi Authentication', description: 'Apple CarPlay USB handshake chip active' },
      { bit: 3, name: 'USB-PD 45W Fast Charge', description: 'Power Delivery high-wattage profile' },
      { bit: 4, name: 'Rear Seat USB Hub', description: 'Rear passenger charging ports monitoring' },
      { bit: 5, name: 'USB Mass Storage Media', description: 'FLAC / MP3 playback via USB flash drives' },
      { bit: 6, name: 'USB Diagnostic Mode', description: 'USB-to-Ethernet ASIX AX88179 engineer access' },
      { bit: 7, name: 'USB OTG / Host Controller', description: 'Dual role host/device controller' }
    ]
  },
  {
    byteIndex: 8,
    name: 'Voice Control & Speech Recognition',
    category: 'System',
    description: 'On-board Nuance/Cerence natural speech dialogue system (SDS).',
    bits: [
      { bit: 0, name: 'Voice Dialog System (SDS)', description: '0=Disabled, 1=Voice Control active (FEC 00030000)' },
      { bit: 1, name: 'Online Natural Voice (IDA / Hey Audi)', description: 'Cloud-based hybrid voice processing' },
      { bit: 2, name: 'PTT Steering Wheel Button', description: 'Push-To-Talk multifunction steering wheel sync' },
      { bit: 3, name: 'Short Voice Prompts', description: 'Expert voice response mode' },
      { bit: 4, name: 'Multi-Zone Mic Beamforming', description: 'Driver vs Passenger speech isolation' },
      { bit: 5, name: 'Alexa / Siri Passthrough', description: 'Long-press PTT triggers smartphone assistant' },
      { bit: 6, name: 'Voice Confirmation Beeps', description: 'Audio acknowledgment chime' },
      { bit: 7, name: 'Speech Logging / Diagnostic', description: 'Diagnostic speech recognition buffer' }
    ]
  },
  {
    byteIndex: 10,
    name: 'Virtual Cockpit / Instrument Cluster BAP Sync',
    category: 'Display & UI',
    description: 'MOST / Ethernet video streaming to Audi Virtual Cockpit or VW Digital Cockpit Pro.',
    bits: [
      { bit: 0, name: 'Digital Cluster Map Streaming', description: 'Ethernet H.264 map video feed to Module 17' },
      { bit: 1, name: 'Simultaneous Dual Map View', description: 'Display map on both Cluster and Center Screen' },
      { bit: 2, name: 'Sport Tachometer View Sync', description: 'RPM, Gear indicator, and G-Meter sync to HUD' },
      { bit: 3, name: 'Head-Up Display (HUD) Integration', description: 'AR-HUD turn-by-turn navigation arrows' },
      { bit: 4, name: 'Album Art to Cluster', description: 'Cover art thumbnail transmission over BAP' },
      { bit: 5, name: 'Phone Favorites in Cluster', description: 'Call log and favorites list in speedo display' },
      { bit: 6, name: 'Traffic Sign Recognition Sync', description: 'VZA camera speed limit overlay sync' },
      { bit: 7, name: 'Cluster Clock / Compass Sync', description: 'Time zone & digital compass master feed' }
    ]
  },
  {
    byteIndex: 14,
    name: 'Wi-Fi Hotspot & Wireless Frequency Bands',
    category: 'Connectivity',
    description: 'Internal WLAN chip operating in 2.4 GHz and high-throughput 5 GHz (802.11ac/ax).',
    bits: [
      { bit: 0, name: 'WLAN Hotspot Module', description: '0=Disabled, 1=WLAN module enabled' },
      { bit: 1, name: '5.8 GHz Band (WLAN 5GHz)', description: '1=Enables DFS 5.2/5.8 GHz required for Wireless CarPlay' },
      { bit: 2, name: 'Client Mode (Station Mode)', description: 'Connect MIB3 to phone tethering / home Wi-Fi' },
      { bit: 3, name: 'WPA3 Enterprise Encryption', description: 'Next-gen Wi-Fi security protocol' },
      { bit: 4, name: 'Hidden SSID Broadcast', description: 'Suppress public Wi-Fi beacon' },
      { bit: 5, name: 'Auto Hotspot Power On', description: 'Activate hotspot immediately on terminal 15' },
      { bit: 6, name: 'WLAN Channel Auto-Hopping', description: 'Dynamic frequency selection against radar/jamming' },
      { bit: 7, name: 'WLAN Country Code Sync', description: 'Regulatory domain lock via GPS position' }
    ]
  },
  {
    byteIndex: 15,
    name: 'Smartphone Interface & Projection Technologies',
    category: 'Connectivity',
    description: 'Enables Apple CarPlay, Google Android Auto, MirrorLink, and Baidu CarLife protocols.',
    bits: [
      { bit: 0, name: 'Apple CarPlay Wired', description: 'USB wired CarPlay interface' },
      { bit: 1, name: 'Apple CarPlay Wireless', description: 'WiFi/BT seamless wireless Apple CarPlay link' },
      { bit: 2, name: 'Google Android Auto Wired', description: 'USB wired Android Auto interface' },
      { bit: 3, name: 'Google Android Auto Wireless', description: 'WiFi/BT seamless wireless Android Auto link' },
      { bit: 4, name: 'MirrorLink Protocol', description: 'VNC-based screen projection' },
      { bit: 5, name: 'Baidu CarLife', description: 'China market smartphone projection' },
      { bit: 6, name: 'Wireless Device Auto-Connect', description: 'Instant auto-pairing of known phone on entry' },
      { bit: 7, name: 'High-Bitrate Audio Protocol', description: 'Lossless audio transmission over wireless link' }
    ]
  },
  {
    byteIndex: 17,
    name: 'HMI Skin, Theme & Brand Visual Identity',
    category: 'Display & UI',
    description: 'Selects the visual theme, gauge skins, accent lines, and welcome splash animations.',
    bits: [
      { bit: 0, name: 'Skin Bit 0', description: 'Theme variant selector bit 0' },
      { bit: 1, name: 'Skin Bit 1', description: 'Theme variant selector bit 1' },
      { bit: 2, name: 'Skin Bit 2', description: 'Theme variant selector bit 2' },
      { bit: 3, name: 'Performance Sport Skin (RS / GTI / Cupra)', description: '0=Standard Luxury, 1=Carbon / Sport Theme' },
      { bit: 4, name: '3D Vehicle Model Rendering', description: 'Real-time OpenGL vehicle color and wheel rendering' },
      { bit: 5, name: 'Welcome Splash Sound Chime', description: 'Audi Heartbeat / VW Welcome audio chime' },
      { bit: 6, name: 'Ambient Lighting Palette Link', description: 'Theme colors dynamic adapt to selected ambient LED' },
      { bit: 7, name: 'Dark Mode / OLED True Black', description: 'Always-dark theme UI mode' }
    ]
  },
  {
    byteIndex: 19,
    name: 'Drive Select & Dynamic Chassis HMI',
    category: 'Vehicle Features',
    description: 'Integration of Audi Drive Select / VW Driving Profile Selection menus and sliders.',
    bits: [
      { bit: 0, name: 'Drive Select Menu Active', description: 'Comfort / Auto / Dynamic / Individual profiles' },
      { bit: 1, name: 'RS Mode / Race Mode Button Sync', description: 'Steering wheel RS1/RS2 or Cupra button popup' },
      { bit: 2, name: 'DCC Suspension Slider HMI', description: '15-stage DCC damper stiffness interactive slider' },
      { bit: 3, name: 'Exhaust Sound Flap Control', description: 'Engine sound profile customization toggle' },
      { bit: 4, name: 'Sport Differential Torque Vectoring', description: 'Rear axle torque split live bar graph' },
      { bit: 5, name: 'ESC Sport / ESC OFF Confirmation', description: 'Stability control shortcut in infotainment' },
      { bit: 6, name: 'Launch Control Ready Flag', description: 'Visual launch control notification in cockpit' },
      { bit: 7, name: 'Air Suspension Ride Height Adjust', description: 'Lift / Offroad / Dynamic level controls' }
    ]
  },
  {
    byteIndex: 21,
    name: 'Engineering & Developer Services (GEM)',
    category: 'Developer & Services',
    description: 'Enables Green Engineering Menu, UART/Telnet developer ports, and internal loggers.',
    bits: [
      { bit: 0, name: 'Developer Menu (GEM) Unlock', description: 'Enables 2-finger touch or Back+Nav GEM entry' },
      { bit: 1, name: 'Screenshot Functionality', description: 'Holding Media button captures PNG to USB flash drive' },
      { bit: 2, name: 'Internal Navigation Log Dump', description: 'Detailed GPS NMEA trace logging to eMMC' },
      { bit: 3, name: 'Ethernet Debug Bridge (D-Bus)', description: 'Opens TCP port for diagnostic RPC commands' },
      { bit: 4, name: 'Crash Dump Telemetry Store', description: 'Stores core dumps on panic rather than silent reboot' },
      { bit: 5, name: 'Software Update (SWDL) Manual Menu', description: 'Manual firmware payload selection from SD/USB' },
      { bit: 6, name: 'Customer Test Mode', description: 'Automated factory burn-in test sequences' },
      { bit: 7, name: 'SSH / Root Shell Daemon', description: 'Direct debug terminal access on bench setups' }
    ]
  },
  {
    byteIndex: 24,
    name: 'Offroad & Telemetry Sensor Suite',
    category: 'Vehicle Features',
    description: 'Offroad information screen: steering angle, pitch & roll inclinometer, altimeter.',
    bits: [
      { bit: 0, name: 'Offroad Display Menu', description: 'Offroad information tile in vehicle menu' },
      { bit: 1, name: 'Steering Angle Sensor Compass', description: 'Front wheel turn angle degrees readout' },
      { bit: 2, name: 'Pitch & Roll Inclinometer', description: 'Vehicle tilt angle display using ESP gyro' },
      { bit: 3, name: 'Barometric Altimeter Display', description: 'Elevation above sea level calculation' },
      { bit: 4, name: 'Coolant & Oil Temp Gauges', description: 'Engine oil and water temperature dials' },
      { bit: 5, name: 'Water Temperature Sensor Feed', description: 'Direct CAN bus sensor packet reading' },
      { bit: 6, name: 'All-Wheel Drive (AWD) Split Display', description: 'Haldex / Quattro Ultra clutch engagement' },
      { bit: 7, name: 'Hill Descent Control HMI', description: 'Downhill assist speed adjustment slider' }
    ]
  }
];

export const MIB3_ADAPTATION_CHANNELS: AdaptationChannel[] = [
  {
    id: 'veh_cfg_apple_carplay',
    channelName: 'Vehicle_configuration',
    subName: 'apple_carplay',
    category: 'Connectivity',
    currentValue: 'on',
    defaultValue: 'off',
    allowedValues: ['on', 'off'],
    description: 'Master switch for Apple CarPlay smartphone projection protocol.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'veh_cfg_google_android_auto',
    channelName: 'Vehicle_configuration',
    subName: 'google_android_auto',
    category: 'Connectivity',
    currentValue: 'on',
    defaultValue: 'off',
    allowedValues: ['on', 'off'],
    description: 'Master switch for Google Android Auto smartphone projection protocol.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'veh_cfg_wlan_5ghz',
    channelName: 'function_configuration_connectivity',
    subName: 'wlan_5ghz_switch',
    category: 'Connectivity',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Mandatory 5GHz DFS Wi-Fi band for Wireless CarPlay / Android Auto bandwidth.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'veh_cfg_wlan_hotspot',
    channelName: 'function_configuration_connectivity',
    subName: 'wlan_hotspot',
    category: 'Connectivity',
    currentValue: 'on',
    defaultValue: 'off',
    allowedValues: ['on', 'off'],
    description: 'Internal MIB3 Wi-Fi hotspot transmitter broadcasting to client devices.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'car_func_bap_sport_display',
    channelName: 'Car_Function_List_BAP_Gen2',
    subName: 'Sport_HMI_display_0x3E',
    category: 'Display & Virtual Cockpit',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'BAP bus message broadcast for Sport Performance monitor gauges (Boost, G-meter, kW).',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'car_func_adapt_sport_msg',
    channelName: 'Car_Function_Adaptations_Gen2',
    subName: 'menu_display_sport_HMI',
    category: 'Display & Virtual Cockpit',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Renders the Sport Performance tile in the vehicle main carousel menu.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'car_func_adapt_sport_clamp15',
    channelName: 'Car_Function_Adaptations_Gen2',
    subName: 'menu_display_sport_HMI_clamp_15_off',
    category: 'Display & Virtual Cockpit',
    currentValue: 'not_blocked',
    defaultValue: 'blocked',
    allowedValues: ['not_blocked', 'blocked'],
    description: 'Keeps Sport HMI values cached when ignition is turned off briefly.',
    requiresSfd: false,
    securityAccess: '20103'
  },
  {
    id: 'car_func_bap_ambient_light',
    channelName: 'Car_Function_List_BAP_Gen2',
    subName: 'Interieur_light_0x08',
    category: 'Lighting & Ambience',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'BAP link to Central Electrics Module 09 for multicolor ambient lighting sync.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'car_func_adapt_ambient_menu',
    channelName: 'Car_Function_Adaptations_Gen2',
    subName: 'menu_display_ambient_light',
    category: 'Lighting & Ambience',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Enables the interactive 30-color ambient light wheel / palette selector.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'car_func_adapt_ambient_clamp15',
    channelName: 'Car_Function_Adaptations_Gen2',
    subName: 'menu_display_ambient_light_clamp_15_off',
    category: 'Lighting & Ambience',
    currentValue: 'not_blocked',
    defaultValue: 'blocked',
    allowedValues: ['not_blocked', 'blocked'],
    description: 'Prevents ambient lighting menu blackout when starting engine.',
    requiresSfd: false,
    securityAccess: '20103'
  },
  {
    id: 'ambient_color_list_profile',
    channelName: 'ambient_light_colors',
    subName: 'color_list_palette_30',
    category: 'Lighting & Ambience',
    currentValue: 'RGB_Palette_30_Colors',
    defaultValue: 'RGB_Palette_10_Colors',
    allowedValues: ['RGB_Palette_10_Colors', 'RGB_Palette_30_Colors', 'Single_Color_White'],
    description: 'Sets the ambient color look-up table to full 30-color RGB spectrum.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'dev_gem_activation',
    channelName: 'developer_menu_configuration',
    subName: 'development_mode',
    category: 'Developer & Services',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Unlocks the Green Engineering Menu (GEM) for firmware diagnostics and patching.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'dev_telnet_service',
    channelName: 'developer_menu_configuration',
    subName: 'telnet_console',
    category: 'Developer & Services',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Enables debug telnet daemon on TCP port 23 via USB-Ethernet adapter.',
    requiresSfd: true,
    securityAccess: 'S12345'
  },
  {
    id: 'nhtsa_speed_threshold_vim',
    channelName: 'nhtsa_properties',
    subName: 'speed_threshold_video_playback',
    category: 'Developer & Services',
    currentValue: '255_kmh',
    defaultValue: '0_kmh',
    allowedValues: ['0_kmh', '5_kmh', '255_kmh'],
    description: 'Video-in-motion (VIM) vehicle speed restriction threshold.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'acoustic_lock_feedback_menu',
    channelName: 'Vehicle_configuration',
    subName: 'acoustic_lock_confirmation_menu',
    category: 'Vehicle Configuration',
    currentValue: 'on',
    defaultValue: 'off',
    allowedValues: ['on', 'off'],
    description: 'Adds checkbox in Car Central Locking menu for horn/chirp chime upon lock/unlock.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'sound_profile_parameter',
    channelName: 'sound_focus_configuration',
    subName: 'sound_profile_preset',
    category: 'Audio & Acoustics',
    currentValue: 'Bang_Olufsen_Dynamic',
    defaultValue: 'Default_Neutral',
    allowedValues: ['Default_Neutral', 'Bang_Olufsen_Dynamic', 'Canton_Surround', 'Harman_Studio', 'Beats_Bass'],
    description: 'DSP acoustic curve parameterization for balanced frequency response and 3D staging.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'offroad_bap_activation',
    channelName: 'Car_Function_List_BAP_Gen2',
    subName: 'Offroad_HMI_display_0x42',
    category: 'Display & Virtual Cockpit',
    currentValue: 'activated',
    defaultValue: 'deactivated',
    allowedValues: ['activated', 'deactivated'],
    description: 'Activates Compass, Altimeter, and Wheel Angle display in Infotainment.',
    requiresSfd: true,
    securityAccess: '20103'
  },
  {
    id: 'cluster_dual_map_mode',
    channelName: 'dashboard_display_configuration',
    subName: 'navigation_map_dual_view',
    category: 'Display & Virtual Cockpit',
    currentValue: 'both_screens',
    defaultValue: 'headunit_or_cluster_exclusive',
    allowedValues: ['both_screens', 'headunit_or_cluster_exclusive'],
    description: 'Allows simultaneous map display on both Virtual Cockpit and center screen.',
    requiresSfd: true,
    securityAccess: '20103'
  }
];

export const RETROFIT_RECIPES: RetrofitRecipe[] = [
  {
    id: 'recipe_wireless_carplay_aa',
    title: 'Wireless Apple CarPlay & Android Auto (5GHz WiFi)',
    category: 'Connectivity',
    description: 'Fully automates the activation of wireless smartphone projection. Configures 5GHz DFS WLAN hotspot, flips smartphone interface bits, and sets vehicle configuration channels.',
    complexity: 'Moderate',
    estimatedTimeSec: 25,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)', 'MIB3GP (Audi MMI)'],
    fecRequired: '00060800 / 00060900',
    byteChanges: [
      { byteIndex: 14, bitIndex: 0, targetValue: true, reason: 'Enable WLAN module' },
      { byteIndex: 14, bitIndex: 1, targetValue: true, reason: 'Enable 5.8 GHz WLAN high-bandwidth channel' },
      { byteIndex: 15, bitIndex: 0, targetValue: true, reason: 'Enable Wired Apple CarPlay' },
      { byteIndex: 15, bitIndex: 1, targetValue: true, reason: 'Enable Wireless Apple CarPlay protocol' },
      { byteIndex: 15, bitIndex: 2, targetValue: true, reason: 'Enable Wired Android Auto' },
      { byteIndex: 15, bitIndex: 3, targetValue: true, reason: 'Enable Wireless Android Auto protocol' }
    ],
    adaptationChanges: [
      { channelId: 'veh_cfg_apple_carplay', targetValue: 'on', reason: 'Activate CarPlay in Vehicle_configuration' },
      { channelId: 'veh_cfg_google_android_auto', targetValue: 'on', reason: 'Activate Android Auto in Vehicle_configuration' },
      { channelId: 'veh_cfg_wlan_5ghz', targetValue: 'activated', reason: 'Unlock 5GHz Wi-Fi spectrum for low latency streaming' },
      { channelId: 'veh_cfg_wlan_hotspot', targetValue: 'on', reason: 'Enable direct car WiFi hotspot for phone pairing' }
    ]
  },
  {
    id: 'recipe_sport_performance_hmi',
    title: 'RS / Cupra / GTI Sport Performance HMI Display',
    category: 'Sport & Cockpit',
    description: 'Enables the live Sport Performance Monitor: Turbo Boost Pressure (bar/psi), Power output (kW), Torque (Nm), G-Force Lateral Accelerometer, and Oil/Coolant telemetry dials.',
    complexity: 'Easy',
    estimatedTimeSec: 15,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3GP (Audi MMI)', 'MIB3 Standard (Aptiv/Delphi)'],
    fecRequired: '00060400',
    byteChanges: [
      { byteIndex: 17, bitIndex: 3, targetValue: true, reason: 'Activate Sport / RS Performance HMI theme skin' },
      { byteIndex: 19, bitIndex: 1, targetValue: true, reason: 'RS / Cupra Mode button sync on steering wheel' }
    ],
    adaptationChanges: [
      { channelId: 'car_func_bap_sport_display', targetValue: 'activated', reason: 'Enable BAP bus broadcast 0x3E for Sport gauges' },
      { channelId: 'car_func_adapt_sport_msg', targetValue: 'activated', reason: 'Add Sport HMI menu item to vehicle screen' },
      { channelId: 'car_func_adapt_sport_clamp15', targetValue: 'not_blocked', reason: 'Prevent gauge freeze during stop-start cycles' }
    ]
  },
  {
    id: 'recipe_ambient_30_color',
    title: '30-Color Ambient Lighting Suite & MIB Color Sync',
    category: 'Comfort & Ambience',
    description: 'Expands the standard 10-color or single-color ambient lighting menu to full 30-color RGB spectrum, syncing MIB3 infotainment skin highlights with interior LED door cards and footwells.',
    complexity: 'Moderate',
    estimatedTimeSec: 20,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)', 'MIB3 Entry (Technisat)'],
    byteChanges: [
      { byteIndex: 17, bitIndex: 6, targetValue: true, reason: 'Link MIB UI accent trim colors to ambient light palette' }
    ],
    adaptationChanges: [
      { channelId: 'car_func_bap_ambient_light', targetValue: 'activated', reason: 'Enable BAP 0x08 interieur light synchronization' },
      { channelId: 'car_func_adapt_ambient_menu', targetValue: 'activated', reason: 'Render ambient lighting color wheel in settings' },
      { channelId: 'car_func_adapt_ambient_clamp15', targetValue: 'not_blocked', reason: 'Ensure ambient color stays loaded at key-on' },
      { channelId: 'ambient_color_list_profile', targetValue: 'RGB_Palette_30_Colors', reason: 'Expand color list table to 30 custom hues' }
    ]
  },
  {
    id: 'recipe_green_engineering_menu',
    title: 'Green Engineering Menu (GEM) & Telnet Developer Mode',
    category: 'Developer & Diagnostics',
    description: 'Unlocks the hidden OEM Green Engineering Menu (GEM) for firmware diagnostics, eMMC logging, FEC status validation, and debug telnet daemon port access.',
    complexity: 'Advanced',
    estimatedTimeSec: 10,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)', 'MIB3GP (Audi MMI)'],
    byteChanges: [
      { byteIndex: 21, bitIndex: 0, targetValue: true, reason: 'Unlock GEM 2-finger gesture / button trigger' },
      { byteIndex: 21, bitIndex: 1, targetValue: true, reason: 'Enable diagnostic screenshot capture to USB' },
      { byteIndex: 21, bitIndex: 3, targetValue: true, reason: 'Enable Ethernet D-Bus diagnostic bridge' }
    ],
    adaptationChanges: [
      { channelId: 'dev_gem_activation', targetValue: 'activated', reason: 'Enable development mode in developer_menu_configuration' },
      { channelId: 'dev_telnet_service', targetValue: 'activated', reason: 'Activate Telnet daemon on TCP port 23' }
    ]
  },
  {
    id: 'recipe_video_in_motion',
    title: 'Video in Motion (VIM) Speed Threshold Bypass',
    category: 'Developer & Diagnostics',
    description: 'Modifies the NHTSA safety speed threshold from 0 km/h to 255 km/h, allowing passengers to watch MP4/MKV video files via USB or mirror displays while vehicle is moving.',
    complexity: 'Easy',
    estimatedTimeSec: 10,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3GP (Audi MMI)'],
    byteChanges: [
      { byteIndex: 5, bitIndex: 5, targetValue: true, reason: 'Enable USB video & high-bitrate media playback' }
    ],
    adaptationChanges: [
      { channelId: 'nhtsa_speed_threshold_vim', targetValue: '255_kmh', reason: 'Set video playback speed cutoff to 255 km/h' }
    ]
  },
  {
    id: 'recipe_audi_dual_maps',
    title: 'Audi Virtual Cockpit & MIB3 Dual-Screen Map Mirroring',
    category: 'Sport & Cockpit',
    description: 'Eliminates the annoying "Exclusive Map Display" restriction where the map can only appear on either the cluster OR the center screen. Renders satellite/vector maps simultaneously on both.',
    complexity: 'Moderate',
    estimatedTimeSec: 15,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3GP (Audi MMI)', 'MIB3 High (Harman)'],
    byteChanges: [
      { byteIndex: 10, bitIndex: 0, targetValue: true, reason: 'Digital cluster H.264 map video streaming over DoIP/Ethernet' },
      { byteIndex: 10, bitIndex: 1, targetValue: true, reason: 'Enable simultaneous dual-map rendering engine' }
    ],
    adaptationChanges: [
      { channelId: 'cluster_dual_map_mode', targetValue: 'both_screens', reason: 'Set navigation map display parameter to both_screens' }
    ]
  },
  {
    id: 'recipe_sound_dsp_upgrade',
    title: 'Acoustic Curve & Bang & Olufsen / Canton DSP Tuning',
    category: 'Audio',
    description: 'Injects high-fidelity equalizer curves, activates dedicated subwoofer gain management slider, and unlocks enhanced sound staging algorithms.',
    complexity: 'Moderate',
    estimatedTimeSec: 20,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)', 'MIB3GP (Audi MMI)'],
    byteChanges: [
      { byteIndex: 3, bitIndex: 2, targetValue: true, reason: 'Expose independent subwoofer control slider in sound menu' },
      { byteIndex: 3, bitIndex: 3, targetValue: true, reason: 'Enable 3D Sound & Surround focus algorithms' },
      { byteIndex: 3, bitIndex: 6, targetValue: true, reason: 'Expand EQ to multi-band parametric equalizer' }
    ],
    adaptationChanges: [
      { channelId: 'sound_profile_parameter', targetValue: 'Bang_Olufsen_Dynamic', reason: 'Load dynamic sound curve acoustic calibration' }
    ]
  },
  {
    id: 'recipe_offroad_telemetry',
    title: 'Offroad Information Display (Compass, Altimeter, Angles)',
    category: 'Sport & Cockpit',
    description: 'Enables the rugged Offroad HMI screen featuring real-time steering angle degrees, pitch and roll gyro inclinometers, barometric altitude, and oil/water temps.',
    complexity: 'Easy',
    estimatedTimeSec: 15,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)'],
    byteChanges: [
      { byteIndex: 24, bitIndex: 0, targetValue: true, reason: 'Enable Offroad display menu item' },
      { byteIndex: 24, bitIndex: 1, targetValue: true, reason: 'Enable steering angle telemetry feed' },
      { byteIndex: 24, bitIndex: 2, targetValue: true, reason: 'Enable pitch & roll ESP inclinometer' },
      { byteIndex: 24, bitIndex: 3, targetValue: true, reason: 'Enable barometric altimeter' }
    ],
    adaptationChanges: [
      { channelId: 'offroad_bap_activation', targetValue: 'activated', reason: 'Activate BAP 0x42 Offroad HMI channel' }
    ]
  },
  {
    id: 'recipe_acoustic_lock_chirp',
    title: 'Acoustic Lock/Unlock Feedback Menu in MIB3',
    category: 'Comfort & Ambience',
    description: 'Adds the "Acoustic Confirmation" checkbox inside the central locking infotainment menu so the driver can toggle chirp sounds on/off without diagnostic tools.',
    complexity: 'Easy',
    estimatedTimeSec: 10,
    requiresSfd: true,
    securityAccess: '20103',
    supportedUnits: ['MIB3 High (Harman)', 'MIB3 Standard (Aptiv/Delphi)', 'MIB3 Entry (Technisat)', 'MIB3GP (Audi MMI)'],
    byteChanges: [],
    adaptationChanges: [
      { channelId: 'acoustic_lock_feedback_menu', targetValue: 'on', reason: 'Expose acoustic lock toggle in vehicle settings' }
    ]
  }
];

export const MIB3_FEC_CODES: FecCode[] = [
  { code: '00040100', description: 'Navigation System (Standard Maps Database)', category: 'Navigation', defaultStatus: 'Valid' },
  { code: '00040101', description: 'Navigation System (Lifetime European Maps)', category: 'Navigation', defaultStatus: 'Valid' },
  { code: '00050000', description: 'Bluetooth Audio Streaming (A2DP) & Telephony', category: 'Connectivity', defaultStatus: 'Valid' },
  { code: '00060100', description: 'Audi Smartphone Interface / VW App-Connect Base', category: 'Connectivity', defaultStatus: 'Valid' },
  { code: '00060800', description: 'Apple CarPlay Wireless 5GHz Interface', category: 'Connectivity', defaultStatus: 'Installed' },
  { code: '00060900', description: 'Google Android Auto Wireless Interface', category: 'Connectivity', defaultStatus: 'Installed' },
  { code: '00060300', description: 'MirrorLink Protocol Smartphone Projection', category: 'Connectivity', defaultStatus: 'Not Installed' },
  { code: '00060400', description: 'Sport HMI Performance Monitor (Boost, G-Meter, kW)', category: 'Sport/UI', defaultStatus: 'Not Installed' },
  { code: '00030000', description: 'Voice Dialog System (Nuance / SDS Voice Control)', category: 'Audio/Voice', defaultStatus: 'Valid' },
  { code: '00070200', description: 'Smartphone Interface Wired (USB)', category: 'Connectivity', defaultStatus: 'Valid' },
  { code: '00070400', description: 'Digital Cockpit Pro Sport Dial Skins', category: 'Sport/UI', defaultStatus: 'Not Installed' }
];

export const DEFAULT_SFD_TOKEN: SfdTokenInfo = {
  vin: 'Non identifié',
  brand: 'Volkswagen AG',
  targetEcu: '0x5F (Information Electronics 1)',
  testerId: 'Non initialisé',
  requestTime: '--:--',
  expirationTime: '--:--',
  rightsMask: 'AUCUN_DROIT',
  status: 'LOCKED'
};
