-- Migration script to merge NEW duplicate stations into streams column (V2)

-- Deleting exact URL duplicates
DELETE FROM stations WHERE id IN (
  '5c6c092b-2b8b-4ac1-a8d0-090f87037fd9',
  'c3357cf1-5108-11ea-b877-52543be04c81',
  '9606c2cd-0601-11e8-ae97-52543be04c81',
  'db145cff-6ea6-4382-ad96-19183eb58079'
);

-- Consolidating: WALM - Old Time Radio
UPDATE stations SET name = 'WALM - Old Time Radio', streams = '[{"url":"https://icecast.walmradio.com:8443/otr","bitrate":128,"format":"mp3","label":"Standard","originalName":"WALM - Old Time Radio"},{"url":"https://icecast.walmradio.com:8443/otr_opus","bitrate":128,"format":"mp3","label":"Standard","originalName":"WALM - Old Time Radio Opus"}]'::jsonb WHERE id = '313046e3-b203-4b9d-bc3e-393da7d97126';
DELETE FROM stations WHERE id IN ('64b357e7-d9e9-4cb6-99b5-4cb6cef785cc');

-- Consolidating: Fox Sports
UPDATE stations SET name = 'Fox Sports', streams = '[{"url":"https://stream.revma.ihrhls.com/zc905","label":"Standard","format":"mp3","bitrate":128},{"url":"https://stream.revma.ihrhls.com/zc1509/hls.m3u8","label":"Standard","format":"mp3","bitrate":128},{"url":"https://playerservices.streamtheworld.com/api/livestream-redirect/KKGKAMAAC.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"KKGK Fox Sports 98.9/1340"},{"url":"http://stream.revma.ihrhls.com/zc4732","bitrate":128,"format":"mp3","label":"Standard","originalName":"Fox Sports Radio - LA"},{"url":"https://ais-sa1.streamon.fm/7852_128k.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"Fox Sports Central"}]'::jsonb WHERE id = '6cdde1c1-fce3-4421-aeea-20cf0d4d000b';
DELETE FROM stations WHERE id IN ('eb2855be-66f5-4e1b-aa93-c78b3b4bedf0', 'b925b368-140d-4526-b270-efbd19647d70', 'f7c182aa-a8be-42a7-b09f-5d5a6e03ace5');

-- Consolidating: Radio Paradise Mellow Mix
UPDATE stations SET name = 'Radio Paradise Mellow Mix', streams = '[{"url":"http://stream-dc1.radioparadise.com/rp_192m.ogg","label":"Standard","format":"ogg","bitrate":128},{"url":"http://stream.radioparadise.com/mellow-flacm","label":"High Quality","format":"flac","bitrate":128},{"url":"https://stream.radioparadise.com/mellow-flac","label":"High Quality","format":"flac","bitrate":128},{"url":"http://stream.radioparadise.com/mellow-192","bitrate":192,"format":"mp3","label":"High Quality","originalName":"Radio Paradise Mellow Mix 192k MP3"},{"url":"http://stream.radioparadise.com/mellow-320","label":"High Quality","format":"aac","bitrate":320}]'::jsonb WHERE id = 'd88c0d24-adb2-11e9-88f4-52543be04c81';
DELETE FROM stations WHERE id IN ('6d3e4d97-fdb0-4d58-a351-f42f8b235062', '2b8ed601-f71c-11e9-bbf2-52543be04c81');

-- Consolidating: Adroit Jazz Underground
UPDATE stations SET name = 'Adroit Jazz Underground', streams = '[{"url":"https://icecast.walmradio.com:8443/jazz","label":"Standard","format":"mp3","bitrate":128},{"url":"https://icecast.walmradio.com:8443/jazz_opus","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = 'ea8059be-d119-4de3-b27b-0d9bd6aedb17';
DELETE FROM stations WHERE id IN ('2ce23ee2-95c5-407d-9df8-54c3cdde2825');

-- Consolidating: Classic Vinyl HD
UPDATE stations SET name = 'Classic Vinyl HD', streams = '[{"url":"https://icecast.walmradio.com:8443/classic","label":"Standard","format":"mp3","bitrate":128},{"url":"https://icecast.walmradio.com:8443/classic_opus","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = 'd1a54d2e-623e-4970-ab11-35f7b56c5ec3';
DELETE FROM stations WHERE id IN ('6ce8da92-859f-4f96-a5e4-503c1ddfbfbf');

-- Consolidating: Ma Radio
UPDATE stations SET name = 'Ma Radio', streams = '[{"url":"https://stream.zeno.fm/g55vgwecvg0uv","bitrate":128,"format":"mp3","label":"Standard","originalName":"Ma Radio"},{"url":"https://wowd.broadcasttool.stream/stream","bitrate":128,"format":"mp3","label":"Standard","originalName":"Takoma Radio WOWD-LP"}]'::jsonb WHERE id = '291';
DELETE FROM stations WHERE id IN ('a678458c-07c8-4504-9372-1213c1bc55fe');

-- Consolidating: News Radio 1000 KTOK
UPDATE stations SET name = 'News Radio 1000 KTOK', streams = '[{"url":"https://stream.revma.ihrhls.com/zc1909","bitrate":128,"format":"mp3","label":"Standard","originalName":"News Radio 1000 KTOK"},{"url":"http://playerservices.streamtheworld.com/api/livestream-redirect/RADIO10.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio 10"}]'::jsonb WHERE id = '11b80df4-b403-47cb-82a1-fbc809886b82';
DELETE FROM stations WHERE id IN ('d227990c-2385-4419-8159-1c73a33a58dd');

-- Consolidating: 101 SMOOTH JAZZ
UPDATE stations SET name = '101 SMOOTH JAZZ', streams = '[{"url":"http://jking.cdnstream1.com/b22139_128mp3","label":"Standard","format":"mp3","bitrate":128},{"url":"http://streaming.live365.com/b48071_128mp3","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = 'd28420a4-eccf-47a2-ace1-088c7e7cb7e0';
DELETE FROM stations WHERE id IN ('934d1811-3412-4d2d-86c8-dd1d8fbb51a7');

-- Consolidating: Radio Twoubakapela
UPDATE stations SET name = 'Radio Twoubakapela', streams = '[{"url":"https://stream.zeno.fm/2qcds32ehf9uv","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio Twoubakapela"},{"url":"http://listen.mitchfm.com/","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio Two"}]'::jsonb WHERE id = '543';
DELETE FROM stations WHERE id IN ('ae4daa24-56fc-493b-99b9-0fd8ad3bad93');

-- Consolidating: Radio Music
UPDATE stations SET name = 'Radio Music', streams = '[{"url":"https://stream.zeno.fm/fpaytdfkbchvv","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio Music"},{"url":"https://war.streamguys1.com:7185/MC01","bitrate":128,"format":"mp3","label":"Standard","originalName":"3ABN Radio Music Channel"},{"url":"https://mediaserver3.afa.net:8443/music.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"American Family Radio: Music"}]'::jsonb WHERE id = '619';
DELETE FROM stations WHERE id IN ('6e9e7d87-49c1-4fc0-a9e8-b73b8871c3c9', 'f7a6ea52-daac-481d-a692-7b6abd9f8cf4');

-- Consolidating: Radio Love
UPDATE stations SET name = 'Radio Love', streams = '[{"url":"https://stream.zeno.fm/zvd2x4bz7upvv","label":"Standard","format":"mp3","bitrate":128},{"url":"https://streaming.radiostreamlive.com/radiolovelive_devices","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = '662';
DELETE FROM stations WHERE id IN ('961cc45e-0601-11e8-ae97-52543be04c81');

-- Consolidating: Radio Zetwa
UPDATE stations SET name = 'Radio Zetwa', streams = '[{"url":"https://stream.zeno.fm/fcek9ccsu5quv","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio Zetwa"},{"url":"http://zet-net-01.cdn.eurozet.pl:8400/","bitrate":128,"format":"mp3","label":"Standard","originalName":"Radio Zet"}]'::jsonb WHERE id = '666';
DELETE FROM stations WHERE id IN ('59e30dda-64bf-11ea-be63-52543be04c81');

-- Consolidating: The
UPDATE stations SET name = 'The', streams = '[{"url":"https://current.stream.publicradio.org/current.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"The"},{"url":"https://das-edge09-live365-dal03.cdnstream.com/a95442","bitrate":128,"format":"mp3","label":"Standard","originalName":"The"}]'::jsonb WHERE id = 'a583847f-2b1f-40a5-a9f2-c3640110248b';
DELETE FROM stations WHERE id IN ('793ab426-0586-42f6-9035-34d9d8e6bef5');

-- Consolidating: Radio Paradise Rock Mix
UPDATE stations SET name = 'Radio Paradise Rock Mix', streams = '[{"url":"https://stream.radioparadise.com/rock-64","label":"Data Saver","format":"aac","bitrate":64},{"url":"http://stream.radioparadise.com/rock-128","label":"Standard","format":"aac","bitrate":128},{"url":"http://stream.radioparadise.com/rock-320","label":"High Quality","format":"aac","bitrate":320}]'::jsonb WHERE id = '9e54d6fc-16a6-4308-9c15-c60aeb1e2de8';
DELETE FROM stations WHERE id IN ('5681d06a-f5af-11e9-bbf2-52543be04c81');

-- Consolidating: SomaFM Groove Salad
UPDATE stations SET name = 'SomaFM Groove Salad', streams = '[{"url":"https://ice2.somafm.com/groovesalad-64-aac","label":"Data Saver","format":"aac","bitrate":64},{"url":"https://ice1.somafm.com/groovesalad-16-aac","label":"Standard","format":"aac","bitrate":128},{"url":"https://ice5.somafm.com/groovesalad-128-aac","label":"Standard","format":"aac","bitrate":128}]'::jsonb WHERE id = '05c3cfd3-2ad7-402d-9dfb-ff6209d9e1db';
DELETE FROM stations WHERE id IN ('962aa032-0601-11e8-ae97-52543be04c81');

-- Consolidating: Chilltrax
UPDATE stations SET name = 'Chilltrax', streams = '[{"url":"http://server1.chilltrax.com:9000/","label":"Standard","format":"mp3","bitrate":128},{"url":"http://streams.electronicmusicradiogroup.org:9050/","label":"Standard","format":"aac","bitrate":128}]'::jsonb WHERE id = '9614537a-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('da2f84d6-edd1-4a87-b83d-39f6b6b3aa55');

-- Consolidating: Ambient Sleeping Pill
UPDATE stations SET name = 'Ambient Sleeping Pill', streams = '[{"url":"http://radio.stereoscenic.com/asp-h","label":"Standard","format":"mp3","bitrate":128},{"url":"http://radio.stereoscenic.com/asp-s","bitrate":128,"format":"mp3","label":"Standard","originalName":"Ambient Sleeping Pill | 128 kbps mp3"}]'::jsonb WHERE id = '961fa288-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('4b4d1308-9fdb-42a7-b92d-6370bc3284fe');

-- Consolidating: Today''s Hot Country
UPDATE stations SET name = 'Today''s Hot Country', streams = '[{"url":"http://ice.stream101.com:9016/stream","bitrate":128,"format":"mp3","label":"Standard","originalName":"Today''s Hot Country"},{"url":"https://prod-54-211-197-50.amperwave.net/piedmont-wakgfmaac-hlsc2.m3u8/?source=v7player&user-id=d3f3223f788e5d1675640c9e0d9b2e78&gpp=DBABLA%7EBVQVAAAABWA.QA&z=1dffe1e8cbb7411d9d41f31d189af8f1&p=1","bitrate":128,"format":"aac","label":"Standard","originalName":"103.3 WAKG - Today''s Hot Country and Cool Classics"}]'::jsonb WHERE id = '5facce98-2f87-11e8-91bf-52543be04c81';
DELETE FROM stations WHERE id IN ('dfa9ba19-b1aa-48cb-ae5b-b2979e9f5585');

-- Consolidating: Alex Jones - Infowars
UPDATE stations SET name = 'Alex Jones - Infowars', streams = '[{"url":"http://173.226.180.143/alexjonesshow-mp3","label":"Standard","format":"mp3","bitrate":128},{"url":"http://stream-mp3.infowars.com/","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = '9cc28ab2-914b-4ae8-a5b8-4ce3b1fba37b';
DELETE FROM stations WHERE id IN ('961a4cdd-0601-11e8-ae97-52543be04c81');

-- Consolidating: __80s HITS
UPDATE stations SET name = '__80s HITS', streams = '[{"url":"http://stream.laut.fm/80sexitos","bitrate":128,"format":"mp3","label":"Standard","originalName":"__80s HITS"},{"url":"http://ec4.yesstreaming.net:2560/","bitrate":128,"format":"mp3","label":"Standard","originalName":"SFLINY 80s Hits"}]'::jsonb WHERE id = '8818e46b-a897-49db-b325-40934d344909';
DELETE FROM stations WHERE id IN ('9a463afd-f678-427d-af5e-963de3004445');

-- Consolidating: Frisky Deep [http]
UPDATE stations SET name = 'Frisky Deep [http]', streams = '[{"url":"http://stream.deep.friskyradio.com/deep_mp3_high","label":"Standard","format":"mp3","bitrate":128},{"url":"http://deep.friskyradio.com/friskydeep_aachi","label":"Standard","format":"aac","bitrate":128}]'::jsonb WHERE id = 'db8f3c40-8be6-4a3c-8767-ffcfae50b8dc';
DELETE FROM stations WHERE id IN ('9612308f-0601-11e8-ae97-52543be04c81');

-- Consolidating: France Info
UPDATE stations SET name = 'France Info', streams = '[{"url":"http://direct.franceinfo.fr/live/franceinfo-midfi.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"France Info"},{"url":"http://icecast.radiofrance.fr/franceinfo-hifi.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"France Info"},{"url":"https://stream.radiofrance.fr/franceinfo/franceinfo_hifi.m3u8","bitrate":128,"format":"mp3","label":"Standard","originalName":"France Info"}]'::jsonb WHERE id = '1cfb151d-a341-11e9-a787-52543be04c81';
DELETE FROM stations WHERE id IN ('31074f8a-e6f4-11e9-a96c-52543be04c81', 'ab6a33e5-e8b5-4cf4-bfb7-ec0ae779cb7c');

-- Consolidating: RTL2
UPDATE stations SET name = 'RTL2', streams = '[{"url":"http://streamer-02.rtl.fr/rtl2-1-44-128","bitrate":128,"format":"mp3","label":"Standard","originalName":"RTL2"},{"url":"http://streaming.radio.rtl2.fr/rtl2-1-44-128","bitrate":128,"format":"mp3","label":"Standard","originalName":"RTL2"}]'::jsonb WHERE id = '034d52a3-30dc-4017-8495-004cd65383b1';
DELETE FROM stations WHERE id IN ('a5a6b881-2900-11e8-91bf-52543be04c81');

-- Consolidating: NOAA Weather Radio
UPDATE stations SET name = 'NOAA Weather Radio', streams = '[{"url":"https://wxradio.org/TX-Dallas-KEC56","label":"Standard","format":"mp3","bitrate":128},{"url":"http://wxradio.org:8000/IN-Indianapolis-KEC74","label":"Standard","format":"mp3","bitrate":128},{"url":"http://stream.mikev.com/khb36.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"NOAA Weather Radio - KHB36 - - 162.550 MHz"},{"url":"https://wxradio.org/CA-Monterey-KEC49","bitrate":128,"format":"mp3","label":"Standard","originalName":"NOAA Weather Radio KEC49, Monterey"},{"url":"https://wxradio.org/KY-Frankfort-WZ2523","bitrate":128,"format":"mp3","label":"Standard","originalName":"WZ2523 - NOAA Weather Radio"},{"url":"https://wxradio.org/OK-Stillwater-WNG654","bitrate":128,"format":"mp3","label":"Standard","originalName":"Stillwater NOAA Weather radio"},{"url":"https://wxradio.org/OH-Mansfield-WWG57","bitrate":128,"format":"mp3","label":"Standard","originalName":"WWG57 162.450 NOAA Weather Radio"},{"url":"https://usa10.fastcast4u.com:3210/1","bitrate":128,"format":"mp3","label":"Standard","originalName":"NOAA Weather Radio Station WXK49 in Memphis"},{"url":"https://wxradio.bobc.io/stream/KHB60","bitrate":128,"format":"mp3","label":"Standard","originalName":"NOAA Weather Radio KHB60 Seattle"},{"url":"https://wxradio.bobc.io/stream/WWG24","bitrate":128,"format":"mp3","label":"Standard","originalName":"NOAA Weather Radio WWG24 Puget Sound Marine"}]'::jsonb WHERE id = 'a1e43e07-b998-4b7c-ac06-9c9c36700613';
DELETE FROM stations WHERE id IN ('14130056-120c-11e9-a80b-52543be04c81', '84fc4a90-e4c3-4949-bded-f3154aeb0725', 'fb5ce3a4-fd4a-49be-9cec-3b681769ddfb', 'f452744b-0909-4492-9123-fc094824494e', 'a626532a-4f9e-40aa-a5dc-7d71e5fca40f', 'f8d2f332-a280-4d5c-8c94-dbc33ca9a8e1', '16e2ffc0-ab42-4007-906a-7514607a4cc6', '1d1a3b16-4ed9-4a01-a62a-1d5bfc5db022');

-- Consolidating: France Inter
UPDATE stations SET name = 'France Inter', streams = '[{"url":"https://stream.radiofrance.fr/franceinter/franceinter_hifi.m3u8?id=radiofrance","bitrate":128,"format":"mp3","label":"Standard","originalName":"France Inter"},{"url":"https://icecast.radiofrance.fr/franceinter-hifi.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"France Inter"},{"url":"http://direct.franceinter.fr/live/franceinter-hifi.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"France Inter"},{"url":"http://direct.franceinter.fr/live/franceinter-midfi.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"France Inter"}]'::jsonb WHERE id = '33960c43-0464-44b4-abfa-73591ebf647f';
DELETE FROM stations WHERE id IN ('0b80555f-eb5c-4fce-94d2-109eec7bee6b', 'd2bbffaf-5d67-4a65-9772-097d8c0269d3', 'd9fc29b8-b152-11e8-afe1-52543be04c81');

-- Consolidating: 181.FM - 80''s Country
UPDATE stations SET name = '181.FM - 80''s Country', streams = '[{"url":"http://listen.181fm.com/181-80scountry_128k.mp3","label":"Standard","format":"mp3","bitrate":128},{"url":"http://listen.181fm.com/181-90scountry_128k.mp3","label":"Standard","format":"mp3","bitrate":128}]'::jsonb WHERE id = '96389fbf-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('9638a3a5-0601-11e8-ae97-52543be04c81');

-- Consolidating: BBC World Service
UPDATE stations SET name = 'BBC World Service', streams = '[{"url":"http://stream.live.vc.bbcmedia.co.uk/bbc_world_service","bitrate":128,"format":"mp3","label":"Standard","originalName":"BBC World Service"},{"url":"http://19013.live.streamtheworld.com/WUAL_HD3_SC","bitrate":128,"format":"mp3","label":"Standard","originalName":"WUAL-HD3 Alabama Public Radio - BBC World Service"},{"url":"http://26423.live.streamtheworld.com:3690/WRVOHD3_SC","bitrate":128,"format":"mp3","label":"Standard","originalName":"WRVO-3 BBC World Service Stream"}]'::jsonb WHERE id = '98adecf7-2683-4408-9be7-02d3f9098eb8';
DELETE FROM stations WHERE id IN ('9626adbb-0601-11e8-ae97-52543be04c81', '961e70ca-0601-11e8-ae97-52543be04c81');

-- Consolidating: Nostalgie
UPDATE stations SET name = 'Nostalgie', streams = '[{"url":"https://streaming.nrjaudio.fm/oua8a3w2dqao?origine=playernostalgie&aw_0_req.userConsentV2=&aw_0_1st.station=","bitrate":128,"format":"mp3","label":"Standard","originalName":"Nostalgie HQ"},{"url":"http://c32.radioboss.fm:8139/stream","bitrate":128,"format":"mp3","label":"Standard","originalName":"Nostalgie"}]'::jsonb WHERE id = 'd39ab442-6c34-4097-afd0-e298ac21e50c';
DELETE FROM stations WHERE id IN ('88740aa4-085b-4158-a863-6d92d2129daa');

-- Consolidating: JOE
UPDATE stations SET name = 'JOE', streams = '[{"url":"https://stream.joe.nl/joe/aachigh","bitrate":128,"format":"aac","label":"Standard","originalName":"JOE"},{"url":"https://icecast-qmusicbe-cdp.triple-it.nl/joe.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"JOE"}]'::jsonb WHERE id = '6add27d4-5573-47b4-ae27-1d05834a9a4a';
DELETE FROM stations WHERE id IN ('529b71b3-ac05-426c-bd8c-6ae981713900');

-- Consolidating: Dance Wave!
UPDATE stations SET name = 'Dance Wave!', streams = '[{"url":"https://dancewave.online/dance.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Dance Wave!"},{"url":"https://retro.dancewave.online/retrodance.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Dance Wave Retro!"}]'::jsonb WHERE id = '962cc6df-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('964be8b7-0601-11e8-ae97-52543be04c81');

-- Consolidating: NPO Radio 1
UPDATE stations SET name = 'NPO Radio 1', streams = '[{"url":"http://icecast.omroep.nl/radio1-bb-mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"NPO Radio 1"},{"url":"http://icecast.omroep.nl/radio2-bb-mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"NPO Radio 2"},{"url":"https://icecast.omroep.nl/radio5-bb-mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"NPO Radio 5"}]'::jsonb WHERE id = '96126f56-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('96126e82-0601-11e8-ae97-52543be04c81', '46e55863-cef7-4f50-954e-3fa7feede49f');

-- Consolidating: RMF FM
UPDATE stations SET name = 'RMF FM', streams = '[{"url":"http://195.150.20.242:8000/rmf_fm","bitrate":128,"format":"mp3","label":"Standard","originalName":"RMF FM"},{"url":"http://195.150.20.9/RMFFM48","bitrate":128,"format":"mp3","label":"Standard","originalName":"RMF FM"}]'::jsonb WHERE id = '399b7c2a-6680-11e8-b15b-52543be04c81';
DELETE FROM stations WHERE id IN ('960d9241-0601-11e8-ae97-52543be04c81');

-- Consolidating: Classical Charlottesville (A service of WTJU 91.1 FM) | The University of Virginia
UPDATE stations SET name = 'Classical Charlottesville (A service of WTJU 91.1 FM) | The University of Virginia', streams = '[{"url":"https://streams.wtju.net/wtju-classical.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Classical Charlottesville (A service of WTJU 91.1 FM) | The University of Virginia"},{"url":"https://streams.wtju.net/wtju-live.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"WTJU 91.1 FM | The University of Virginia"}]'::jsonb WHERE id = 'c7d79d60-14bc-47da-b7a0-66cb6ff4c41e';
DELETE FROM stations WHERE id IN ('6fd171cd-6f94-4e27-be25-eace7e1151b8');

-- Consolidating: RFI Afrique
UPDATE stations SET name = 'RFI Afrique', streams = '[{"url":"http://live02.rfi.fr/rfiafrique-96k.mp3","bitrate":96,"format":"mp3","label":"Standard","originalName":"RFI-Afrique"},{"url":"http://live02.rfi.fr/rfiafrique-64.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"RFI Afrique"}]'::jsonb WHERE id = '960c2914-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('c2698fb7-f7ec-401d-904f-ef4284501bd9');

-- Consolidating: WALM 2 HD Opus
UPDATE stations SET name = 'WALM 2 HD Opus', streams = '[{"url":"https://icecast.walmradio.com:8443/walm2_opus","bitrate":128,"format":"mp3","label":"Standard","originalName":"WALM 2 HD Opus"},{"url":"https://icecast.walmradio.com:8443/walm2","bitrate":128,"format":"mp3","label":"Standard","originalName":"WALM 2 HD"}]'::jsonb WHERE id = 'b96225b2-8536-4b9b-8add-03582fd2e6a2';
DELETE FROM stations WHERE id IN ('64bb1467-2585-4454-a96f-34cfbc864d41');

-- Consolidating: Christmas Vinyl HD Opus
UPDATE stations SET name = 'Christmas Vinyl HD Opus', streams = '[{"url":"https://icecast.walmradio.com:8443/christmas_opus","bitrate":128,"format":"mp3","label":"Standard","originalName":"Christmas Vinyl HD Opus"},{"url":"https://icecast.walmradio.com:8443/christmas","bitrate":128,"format":"mp3","label":"Standard","originalName":"Christmas Vinyl HD"}]'::jsonb WHERE id = '24e3676a-8de5-474c-8ed2-288fbb66d447';
DELETE FROM stations WHERE id IN ('6eff3484-4ab4-4d36-bf27-9172c5aac15c');

-- Consolidating: Ретро FM
UPDATE stations SET name = 'Ретро FM', streams = '[{"url":"http://retroserver.streamr.ru:8043/retro256.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Ретро FM"},{"url":"http://retro70.hostingradio.ru:8025/retro70-128.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"Ретро FM 70e"}]'::jsonb WHERE id = '964fade0-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE id IN ('960faade-0601-11e8-ae97-52543be04c81');

-- Consolidating: Дорожное радио
UPDATE stations SET name = 'Дорожное радио', streams = '[{"url":"http://dorognoe.hostingradio.ru:8000/radio","bitrate":128,"format":"mp3","label":"Standard","originalName":"Дорожное радио"},{"url":"http://dorognoe.hostingradio.ru:8000/dorognoe","bitrate":128,"format":"mp3","label":"Standard","originalName":"дорожное радио (Dorognoe Radio)"}]'::jsonb WHERE id = '0a364b59-56b6-11e9-aa33-52543be04c81';
DELETE FROM stations WHERE id IN ('961e5274-0601-11e8-ae97-52543be04c81');

-- Consolidating: The Jazz Groove (West)
UPDATE stations SET name = 'The Jazz Groove (West)', streams = '[{"url":"http://west-aac-64.streamthejazzgroove.com/stream","bitrate":128,"format":"aac","label":"Standard","originalName":"The Jazz Groove (West)"},{"url":"http://west-mp3-128.streamthejazzgroove.com/;stream.mp3","bitrate":128,"format":"mp3","label":"Standard","originalName":"thejazzgroove.org WEST"}]'::jsonb WHERE id = 'dc5b2464-f1c5-402f-af4a-e39a6d063d00';
DELETE FROM stations WHERE id IN ('961f96ed-0601-11e8-ae97-52543be04c81');

-- Consolidating: Plus Radio ''
UPDATE stations SET name = 'Plus Radio ''', streams = '[{"url":"https://14223.live.streamtheworld.com/SP_R3488031_SC","bitrate":128,"format":"mp3","label":"Standard","originalName":"Plus Radio ''"},{"url":"https://26343.live.streamtheworld.com/SAM10AAC060_SC","bitrate":128,"format":"aac","label":"Standard","originalName":"Plus Radio Hit"},{"url":"https://samcloud.spacial.com/api/listen?sid=137873&rid=292677&f=aac,any&br=64000","bitrate":128,"format":"aac","label":"Standard","originalName":"Plus Radio Rock"},{"url":"https://19003.live.streamtheworld.com/SP_R2603075_SC","bitrate":128,"format":"mp3","label":"Standard","originalName":"Plus Radio Narodna"},{"url":"https://samcloud.spacial.com/api/listen?sid=104138&rid=181424&f=aac,any&br=64000,any","bitrate":128,"format":"aac","label":"Standard","originalName":"Plus Radio Nostalgija"},{"url":"https://19003.live.streamtheworld.com/SP_R3150576_SC","bitrate":128,"format":"mp3","label":"Standard","originalName":"Plus Radio Klinci"},{"url":"https://15113.live.streamtheworld.com/SAM06AAC231_SC","bitrate":128,"format":"aac","label":"Standard","originalName":"Plus Radio Zabavna"},{"url":"https://15113.live.streamtheworld.com/SAM05AAC611_SC","bitrate":128,"format":"aac","label":"Standard","originalName":"Plus Radio Trending"}]'::jsonb WHERE id = '4fa59f97-5076-4552-93b8-c215a1579ff6';
DELETE FROM stations WHERE id IN ('69297813-a1af-4e3b-8a61-71af664c6dcc', '8e97b31e-b651-4372-ae4e-b212031b5078', '843483b1-61ca-496d-8c42-b53b2247919f', '4a38d8c2-aa08-4e2e-812a-4e1e231ddd54', '29dd1040-cc41-49fb-8deb-eaf51ae06b74', '1de34f0a-f6b7-4ae6-a185-8a71f1c0cd44', 'cf6ced03-0f6a-455d-b14b-53352d06839e');

-- Consolidating: His Radio
UPDATE stations SET name = 'His Radio', streams = '[{"url":"https://rtn.cdnstream1.com/2566_96.aac","bitrate":128,"format":"aac","label":"Standard","originalName":"His Radio"},{"url":"https://rtn.cdnstream1.com/2569_48.aac?rand=29574","bitrate":128,"format":"aac","label":"Standard","originalName":"His Radio Classic"}]'::jsonb WHERE id = '05029f05-0ce4-49ac-97d4-363cf73eee0f';
DELETE FROM stations WHERE id IN ('f7f1735f-7dc2-4091-9d2b-89c2d41a367f');

