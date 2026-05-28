-- Migration script to merge duplicate stations into streams column
-- Generated from user-curated similar_stations_fuzzy.md

UPDATE stations SET name = 'WQXR', streams = '[{"url":"http://opera-stream.wqxr.org/operavore-tunein","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://q2stream.wqxr.org/q2","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.wqxr.org/wqxr-web?nyprBrowserId=32c67956bf1d5600","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://q2stream.wqxr.org/q2.aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '96153188-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://opera-stream.wqxr.org/operavore-tunein', 'http://q2stream.wqxr.org/q2', 'https://stream.wqxr.org/wqxr-web?nyprBrowserId=32c67956bf1d5600', 'https://q2stream.wqxr.org/q2.aac') AND id != '96153188-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'CPR Classical', streams = '[{"url":"https://stream1.cprnetwork.org/cpr2_lo","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream1.cprnetwork.org/2110_128.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://stream1.cprnetwork.org/2110_256.aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '021f141f-378f-4cbf-9593-baf56c154ce8';
DELETE FROM stations WHERE stream_url IN ('https://stream1.cprnetwork.org/cpr2_lo', 'https://stream1.cprnetwork.org/2110_128.aac', 'https://stream1.cprnetwork.org/2110_256.aac') AND id != '021f141f-378f-4cbf-9593-baf56c154ce8';

UPDATE stations SET name = 'Radio Castro International', streams = '[{"url":"https://stream.zeno.fm/g9qxsqg2kuhvv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/kosbakj9srcvv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '444';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/g9qxsqg2kuhvv', 'https://stream.zeno.fm/kosbakj9srcvv') AND id != '444';

UPDATE stations SET name = 'Radio Paradise Mellow Mix', streams = '[{"url":"http://stream-dc1.radioparadise.com/rp_192m.ogg","bitrate":128,"format":"ogg","label":"Standard"},{"url":"http://stream.radioparadise.com/mellow-320","bitrate":320,"format":"aac","label":"High Quality"}]'::jsonb WHERE id = 'd88c0d24-adb2-11e9-88f4-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://stream-dc1.radioparadise.com/rp_192m.ogg', 'http://stream.radioparadise.com/mellow-320') AND id != 'd88c0d24-adb2-11e9-88f4-52543be04c81';

UPDATE stations SET name = 'KSDS "Jazz 88.3"', streams = '[{"url":"http://listen.jazz88.org/ksds.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ksds-ice.streamguys1.com/ksds.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '96269ba0-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://listen.jazz88.org/ksds.mp3', 'https://ksds-ice.streamguys1.com/ksds.mp3') AND id != '96269ba0-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'CBS Sports', streams = '[{"url":"https://playerservices.streamtheworld.com/api/livestream-redirect/WXNTAMAAC.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://ice66.securenetsystems.net/WVGM","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '4cca5032-15b2-4d23-b390-545e09c89bb0';
DELETE FROM stations WHERE stream_url IN ('https://playerservices.streamtheworld.com/api/livestream-redirect/WXNTAMAAC.aac', 'https://ice66.securenetsystems.net/WVGM') AND id != '4cca5032-15b2-4d23-b390-545e09c89bb0';

UPDATE stations SET name = 'KJLH "Radio Free 102.3"', streams = '[{"url":"http://54.89.223.213/kjlh-kjlhfmaac-ibc2?session-id=379fb1c702aa2ec1247f8616c866620c","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://server10.reliastream.com/proxy/damiller?mp=/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9618193a-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://54.89.223.213/kjlh-kjlhfmaac-ibc2?session-id=379fb1c702aa2ec1247f8616c866620c', 'https://server10.reliastream.com/proxy/damiller?mp=/stream') AND id != '9618193a-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Impact FM', streams = '[{"url":"https://stream.zeno.fm/dujtyfff2c4vv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/fupvuxbbn20vv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '38';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/dujtyfff2c4vv', 'https://stream.zeno.fm/fupvuxbbn20vv') AND id != '38';

UPDATE stations SET name = 'Radio Levanjil Fm du Cap-Haitien', streams = '[{"url":"https://stream.zeno.fm/yjaefrsyfk9tv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/exz132q2v7zuv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '359';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/yjaefrsyfk9tv', 'https://stream.zeno.fm/exz132q2v7zuv') AND id != '359';

UPDATE stations SET name = 'Radio Vibration Inter', streams = '[{"url":"https://stream.zeno.fm/grf74g1u1ceuv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/zggzvlsrhr3uv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '197';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/grf74g1u1ceuv', 'https://stream.zeno.fm/zggzvlsrhr3uv') AND id != '197';

UPDATE stations SET name = 'Radio Puissance Inter', streams = '[{"url":"https://stream.zeno.fm/34ahexrtsuquv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://146.71.118.220:35008/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '275';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/34ahexrtsuquv', 'http://146.71.118.220:35008/stream') AND id != '275';

UPDATE stations SET name = '100 Hip Hop and RNB FM (Official)', streams = '[{"url":"https://streaming.shoutcast.com/100-hip-hop-and-rnb-fm","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ice64.securenetsystems.net/LFTM","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'dba1b7bc-6b92-409c-a543-8b42eec25636';
DELETE FROM stations WHERE stream_url IN ('https://streaming.shoutcast.com/100-hip-hop-and-rnb-fm', 'https://ice64.securenetsystems.net/LFTM') AND id != 'dba1b7bc-6b92-409c-a543-8b42eec25636';

UPDATE stations SET name = 'Radio Ideal FM Haiti', streams = '[{"url":"https://stream.zeno.fm/0naec4y686duv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/bxvusi8j0fwvv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '51';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/0naec4y686duv', 'https://stream.zeno.fm/bxvusi8j0fwvv') AND id != '51';

UPDATE stations SET name = 'Chilltrax', streams = '[{"url":"http://server1.chilltrax.com:9000/","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://streams.electronicmusicradiogroup.org:9050/","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '9614537a-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://server1.chilltrax.com:9000/', 'http://streams.electronicmusicradiogroup.org:9050/') AND id != '9614537a-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Ambient Sleeping Pill', streams = '[{"url":"http://radio.stereoscenic.com/asp-h","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '961fa288-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://radio.stereoscenic.com/asp-h') AND id != '961fa288-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Force Fm', streams = '[{"url":"http://208.71.171.204:8210/;","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/rlqf7dzyi0puv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '75';
DELETE FROM stations WHERE stream_url IN ('http://208.71.171.204:8210/;', 'https://stream.zeno.fm/rlqf7dzyi0puv') AND id != '75';

UPDATE stations SET name = '98.5 El Patron', streams = '[{"url":"https://stream.revma.ihrhls.com/zc6969","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ample.revma.ihrhls.com/zc6872/40_n95p6xek6ufh02/playlist.m3u8","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'c122ae65-162d-4ef5-9279-03591a7bef3f';
DELETE FROM stations WHERE stream_url IN ('https://stream.revma.ihrhls.com/zc6969', 'https://ample.revma.ihrhls.com/zc6872/40_n95p6xek6ufh02/playlist.m3u8') AND id != 'c122ae65-162d-4ef5-9279-03591a7bef3f';

UPDATE stations SET name = 'Radio Groove Fm Bas-de-sault', streams = '[{"url":"https://stream.zeno.fm/hmdvu0rg3icuv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://cast5.asurahosting.com/proxy/jodel/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '435';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/hmdvu0rg3icuv', 'https://cast5.asurahosting.com/proxy/jodel/stream') AND id != '435';

UPDATE stations SET name = '101 SMOOTH JAZZ', streams = '[{"url":"http://jking.cdnstream1.com/b22139_128mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://streaming.live365.com/b48071_128mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'd28420a4-eccf-47a2-ace1-088c7e7cb7e0';
DELETE FROM stations WHERE stream_url IN ('http://jking.cdnstream1.com/b22139_128mp3', 'http://streaming.live365.com/b48071_128mp3') AND id != 'd28420a4-eccf-47a2-ace1-088c7e7cb7e0';

UPDATE stations SET name = 'Radio Original FM 99.5 Jacmel', streams = '[{"url":"https://stream.zeno.fm/j8zvudktonnvv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.zeno.fm/rncs0dtztdovv","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '515';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/j8zvudktonnvv', 'https://stream.zeno.fm/rncs0dtztdovv') AND id != '515';

UPDATE stations SET name = 'Radio Love', streams = '[{"url":"https://stream.zeno.fm/zvd2x4bz7upvv","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://streaming.radiostreamlive.com/radiolovelive_devices","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '662';
DELETE FROM stations WHERE stream_url IN ('https://stream.zeno.fm/zvd2x4bz7upvv', 'https://streaming.radiostreamlive.com/radiolovelive_devices') AND id != '662';

UPDATE stations SET name = '98.7 Arizona Sports KMVP', streams = '[{"url":"https://bonneville.cdnstream1.com/2699_48.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://bonneville.cdnstream1.com/2699_48.aac?aw_0_1st.playerid=Tuner&newListeningSessionID=658c86850078d62d_39374685_ogA0dE7B_MjE2LjIzNS44MC43Njo4MA%21%21_000000CVqR9","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '4f7f32f3-5d60-43ed-99aa-ea3a563918f3';
DELETE FROM stations WHERE stream_url IN ('https://bonneville.cdnstream1.com/2699_48.aac', 'https://bonneville.cdnstream1.com/2699_48.aac?aw_0_1st.playerid=Tuner&newListeningSessionID=658c86850078d62d_39374685_ogA0dE7B_MjE2LjIzNS44MC43Njo4MA%21%21_000000CVqR9') AND id != '4f7f32f3-5d60-43ed-99aa-ea3a563918f3';

UPDATE stations SET name = 'KJazz 88.1 The Bebop Channel', streams = '[{"url":"https://streaming.live365.com/a45189_2","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://streaming.live365.com/a45189/playlist.m3u8","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'de92b7cc-45ef-4437-8c56-4b9558cab937';
DELETE FROM stations WHERE stream_url IN ('https://streaming.live365.com/a45189_2', 'https://streaming.live365.com/a45189/playlist.m3u8') AND id != 'de92b7cc-45ef-4437-8c56-4b9558cab937';

UPDATE stations SET name = '104.1 The Hawk', streams = '[{"url":"https://27163.live.streamtheworld.com/KHKKFM.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://17793.live.streamtheworld.com/KHKKFMAAC_SC","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '3c2a83cd-f54d-43aa-a197-7e38f4ee43ce';
DELETE FROM stations WHERE stream_url IN ('https://27163.live.streamtheworld.com/KHKKFM.mp3', 'http://17793.live.streamtheworld.com/KHKKFMAAC_SC') AND id != '3c2a83cd-f54d-43aa-a197-7e38f4ee43ce';

UPDATE stations SET name = '94.7 KUMU', streams = '[{"url":"https://pacificmedia.cdnstream1.com/2783_128.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://pacificmedia.cdnstream1.com/2783_64.aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = 'faea95b2-cd79-4e9d-9048-016c05039226';
DELETE FROM stations WHERE stream_url IN ('https://pacificmedia.cdnstream1.com/2783_128.mp3', 'https://pacificmedia.cdnstream1.com/2783_64.aac') AND id != 'faea95b2-cd79-4e9d-9048-016c05039226';

UPDATE stations SET name = '107.9 The Mix', streams = '[{"url":"https://playerservices.streamtheworld.com/api/livestream-redirect/WNTRFMAAC.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://26733.live.streamtheworld.com/WNTRFM_SC","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '4d16f512-9ce8-4bc1-8926-33104bd328be';
DELETE FROM stations WHERE stream_url IN ('https://playerservices.streamtheworld.com/api/livestream-redirect/WNTRFMAAC.aac', 'https://26733.live.streamtheworld.com/WNTRFM_SC') AND id != '4d16f512-9ce8-4bc1-8926-33104bd328be';

UPDATE stations SET name = 'WSDL 90.7 Rhythm & News', streams = '[{"url":"https://26153.live.streamtheworld.com/WSDLFM.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://14843.live.streamtheworld.com/WSDLFM_SC","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'be9d864c-9895-4494-90c4-b4df8b27faa6';
DELETE FROM stations WHERE stream_url IN ('https://26153.live.streamtheworld.com/WSDLFM.mp3', 'http://14843.live.streamtheworld.com/WSDLFM_SC') AND id != 'be9d864c-9895-4494-90c4-b4df8b27faa6';

UPDATE stations SET name = 'WUSB 90.1 (Lo-Fi)', streams = '[{"url":"http://stream.wusb.stonybrook.edu:8080/;","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://stream.wusb.stonybrook.edu:8090/;.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'ffdb9482-bb13-11e9-acb2-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://stream.wusb.stonybrook.edu:8080/;', 'http://stream.wusb.stonybrook.edu:8090/;.mp3') AND id != 'ffdb9482-bb13-11e9-acb2-52543be04c81';

UPDATE stations SET name = 'SomaFM Black Rock FM', streams = '[{"url":"http://ice6.somafm.com/brfm-128-mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://ice5.somafm.com/beatblender-128-aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '9614f26b-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://ice6.somafm.com/brfm-128-mp3', 'http://ice5.somafm.com/beatblender-128-aac') AND id != '9614f26b-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'WWNO 89.9 (NPR)', streams = '[{"url":"https://tektite.streamguys1.com:5145/wwnolive?uuid=vdz21fmx","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://tektite.streamguys1.com:5140/wwnolive-mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'b9a0d793-fc6e-4ab5-b026-647054a15f06';
DELETE FROM stations WHERE stream_url IN ('https://tektite.streamguys1.com:5145/wwnolive?uuid=vdz21fmx', 'http://tektite.streamguys1.com:5140/wwnolive-mp3') AND id != 'b9a0d793-fc6e-4ab5-b026-647054a15f06';

UPDATE stations SET name = '105.3 WJEN Cat Country', streams = '[{"url":"https://ais-sa1.streamon.fm/7823_96k.aac","bitrate":96,"format":"aac","label":"Standard"},{"url":"https://prod-44-222-183-215.amperwave.net/townsquare-kctrfmaac-hlsc3.m3u8","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = 'ea646208-5f07-4458-a897-10ca0ab8f4e2';
DELETE FROM stations WHERE stream_url IN ('https://ais-sa1.streamon.fm/7823_96k.aac', 'https://prod-44-222-183-215.amperwave.net/townsquare-kctrfmaac-hlsc3.m3u8') AND id != 'ea646208-5f07-4458-a897-10ca0ab8f4e2';

UPDATE stations SET name = '98.6 the mix server 2', streams = '[{"url":"http://listen.986themix.com:8532/live2","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://listen.986themix.com:8532/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '693c1930-3b9a-4005-9f31-48f0a50a88d2';
DELETE FROM stations WHERE stream_url IN ('http://listen.986themix.com:8532/live2', 'http://listen.986themix.com:8532/stream') AND id != '693c1930-3b9a-4005-9f31-48f0a50a88d2';

UPDATE stations SET name = 'KEXP 90.3', streams = '[{"url":"https://kexp.streamguys1.com/kexp160.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"http://live-mp3-128.kexp.org/kexp128.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '445cbb3a-1c4e-49aa-a268-f5b6acfa8f2e';
DELETE FROM stations WHERE stream_url IN ('https://kexp.streamguys1.com/kexp160.aac', 'http://live-mp3-128.kexp.org/kexp128.mp3') AND id != '445cbb3a-1c4e-49aa-a268-f5b6acfa8f2e';

UPDATE stations SET name = 'WREK 91.1', streams = '[{"url":"http://streaming.wrek.org:8000/wrek_live-24kb-mono","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://streaming.wrek.org:8000/main/128kb.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '960dd937-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://streaming.wrek.org:8000/wrek_live-24kb-mono', 'http://streaming.wrek.org:8000/main/128kb.mp3') AND id != '960dd937-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'WFMU 91.1', streams = '[{"url":"http://stream3.wfmu.org/freeform-32k","bitrate":32,"format":"mp3","label":"Data Saver"},{"url":"http://stream2.wfmu.org/freeform-128k","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9644c9cb-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://stream3.wfmu.org/freeform-32k', 'http://stream2.wfmu.org/freeform-128k') AND id != '9644c9cb-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Frisky Deep [http]', streams = '[{"url":"http://stream.deep.friskyradio.com/deep_mp3_high","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://deep.friskyradio.com/friskydeep_aachi","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = 'db8f3c40-8be6-4a3c-8767-ffcfae50b8dc';
DELETE FROM stations WHERE stream_url IN ('http://stream.deep.friskyradio.com/deep_mp3_high', 'http://deep.friskyradio.com/friskydeep_aachi') AND id != 'db8f3c40-8be6-4a3c-8767-ffcfae50b8dc';

UPDATE stations SET name = 'Radio Symphony', streams = '[{"url":"https://streaming.radiostreamlive.com/radiosymphony_devices","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://streaming.radiostreamlive.com/radiosymphony_devices-low?token=%3C?%20echo%20rand%20(1,200000);%20?%3E","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '962b76f6-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('https://streaming.radiostreamlive.com/radiosymphony_devices', 'https://streaming.radiostreamlive.com/radiosymphony_devices-low?token=%3C?%20echo%20rand%20(1,200000);%20?%3E') AND id != '962b76f6-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'WKXP - 94.3 Lite FM', streams = '[{"url":"https://prod-44-197-182-208.amperwave.net/townsquare-wkxpfmaac-hlsc3.m3u8/","bitrate":128,"format":"aac","label":"Standard"},{"url":"https://live.amperwave.net/direct/townsquare-wkxpfmmp3-ibc3.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '2a7cbd50-6a1c-44b3-80ce-7a082102a8f8';
DELETE FROM stations WHERE stream_url IN ('https://prod-44-197-182-208.amperwave.net/townsquare-wkxpfmaac-hlsc3.m3u8/', 'https://live.amperwave.net/direct/townsquare-wkxpfmmp3-ibc3.mp3') AND id != '2a7cbd50-6a1c-44b3-80ce-7a082102a8f8';

UPDATE stations SET name = '181.FM - Kickin'' Country', streams = '[{"url":"http://listen.181fm.com/181-kickincountry_128k.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ice24.securenetsystems.net/WWKC?playSessionID=426A3439-F802-AB34-B26FD241D2991F78&type=.mp3&autoPlay=true","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '960d4bdc-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://listen.181fm.com/181-kickincountry_128k.mp3', 'https://ice24.securenetsystems.net/WWKC?playSessionID=426A3439-F802-AB34-B26FD241D2991F78&type=.mp3&autoPlay=true') AND id != '960d4bdc-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Alex Jones - Infowars', streams = '[{"url":"http://173.226.180.143/alexjonesshow-mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://stream-mp3.infowars.com/","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9cc28ab2-914b-4ae8-a5b8-4ce3b1fba37b';
DELETE FROM stations WHERE stream_url IN ('http://173.226.180.143/alexjonesshow-mp3', 'http://stream-mp3.infowars.com/') AND id != '9cc28ab2-914b-4ae8-a5b8-4ce3b1fba37b';

UPDATE stations SET name = '90.9 The Light', streams = '[{"url":"https://ic.liberty.edu:8443/WQLU","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://ic.liberty.edu:8000/WQLU","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '68658161-892c-4fc8-9cec-38ec60a9841f';
DELETE FROM stations WHERE stream_url IN ('https://ic.liberty.edu:8443/WQLU', 'http://ic.liberty.edu:8000/WQLU') AND id != '68658161-892c-4fc8-9cec-38ec60a9841f';

UPDATE stations SET name = 'WFYI 90.1', streams = '[{"url":"https://wfyi-iad.streamguys1.com/wfyi-hd2","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://wfyi-iad.streamguys1.com/live","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'a9d2cd4c-b76b-4773-998e-2b8e4f8c0c1c';
DELETE FROM stations WHERE stream_url IN ('https://wfyi-iad.streamguys1.com/wfyi-hd2', 'http://wfyi-iad.streamguys1.com/live') AND id != 'a9d2cd4c-b76b-4773-998e-2b8e4f8c0c1c';

UPDATE stations SET name = 'WBFR 89.5 FM Family Radio', streams = '[{"url":"https://ais-sa3.cdnstream1.com/2641_64.aac","bitrate":128,"format":"aac","label":"Standard"},{"url":"http://ais-sa3.cdnstream1.com/2640_64.aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '135de9c7-43b2-4ce4-90a3-c9a84f062878';
DELETE FROM stations WHERE stream_url IN ('https://ais-sa3.cdnstream1.com/2641_64.aac', 'http://ais-sa3.cdnstream1.com/2640_64.aac') AND id != '135de9c7-43b2-4ce4-90a3-c9a84f062878';

UPDATE stations SET name = '100.3 The Edge', streams = '[{"url":"https://ample.revma.ihrhls.com/zc89/11_1v7zzn0xnejsy02/playlist.m3u8?zip=&streamid=89&pname=live_profile&companionAds=false&dist=iheart&terminalId=159&deviceName=web-mobile&aw_0_1st.playerid=iHeartRadioWebPlayer&listenerId=&clientType=web&profileId=6952492483&aw_0_1st.skey=6952492483&host=webapp.US&playedFrom=157&stationid=89&territory=US","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://stream.revma.ihrhls.com/zc89","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9cba3792-aed0-41b2-9ad4-4067815049ab';
DELETE FROM stations WHERE stream_url IN ('https://ample.revma.ihrhls.com/zc89/11_1v7zzn0xnejsy02/playlist.m3u8?zip=&streamid=89&pname=live_profile&companionAds=false&dist=iheart&terminalId=159&deviceName=web-mobile&aw_0_1st.playerid=iHeartRadioWebPlayer&listenerId=&clientType=web&profileId=6952492483&aw_0_1st.skey=6952492483&host=webapp.US&playedFrom=157&stationid=89&territory=US', 'http://stream.revma.ihrhls.com/zc89') AND id != '9cba3792-aed0-41b2-9ad4-4067815049ab';

UPDATE stations SET name = 'WWNW 88.9 "Titan Radio" Westminster College', streams = '[{"url":"http://ice64.securenetsystems.net/WWNW","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ice64.securenetsystems.net/WWNW","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9632da92-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://ice64.securenetsystems.net/WWNW', 'https://ice64.securenetsystems.net/WWNW') AND id != '9632da92-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'High', streams = '[{"url":"http://27873.live.streamtheworld.com/KANZFM_HPPR2_SC","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://14843.live.streamtheworld.com/KANZFM_HPPR_SC","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '96254c75-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://27873.live.streamtheworld.com/KANZFM_HPPR2_SC', 'http://14843.live.streamtheworld.com/KANZFM_HPPR_SC') AND id != '96254c75-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'WUNC 91.5 HD-2', streams = '[{"url":"http://wunc-ice.streamguys1.com/wunc-hd2-128-mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://wunc-ice.streamguys1.com/wunc-128-mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'ee54f890-fa3b-11e9-bbf2-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://wunc-ice.streamguys1.com/wunc-hd2-128-mp3', 'http://wunc-ice.streamguys1.com/wunc-128-mp3') AND id != 'ee54f890-fa3b-11e9-bbf2-52543be04c81';

UPDATE stations SET name = 'KWVN "Hot 107.7"', streams = '[{"url":"http://18433.live.streamtheworld.com:3690/KWVNFM_SC","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://playerservices.streamtheworld.com/api/livestream-redirect/WUHTFMAAC.aac","bitrate":128,"format":"aac","label":"Standard"}]'::jsonb WHERE id = '9641fcdb-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://18433.live.streamtheworld.com:3690/KWVNFM_SC', 'https://playerservices.streamtheworld.com/api/livestream-redirect/WUHTFMAAC.aac') AND id != '9641fcdb-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = '94.9 The Surf', streams = '[{"url":"https://ice24.securenetsystems.net/WVCO?playSessionID=1E009D1C-91CC-364D-ED1C527217927522","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ice24.securenetsystems.net/WVCO","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '65907e2c-193c-4ba6-933e-557d287ccc56';
DELETE FROM stations WHERE stream_url IN ('https://ice24.securenetsystems.net/WVCO?playSessionID=1E009D1C-91CC-364D-ED1C527217927522', 'https://ice24.securenetsystems.net/WVCO') AND id != '65907e2c-193c-4ba6-933e-557d287ccc56';

UPDATE stations SET name = 'HPR1 Traditional Classic Country', streams = '[{"url":"http://207.244.126.86:7733/stream","bitrate":32,"format":"mp3","label":"Data Saver"},{"url":"http://207.244.126.86:7713/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '113d7536-ce6f-42eb-b758-ec73f9de4852';
DELETE FROM stations WHERE stream_url IN ('http://207.244.126.86:7733/stream', 'http://207.244.126.86:7713/stream') AND id != '113d7536-ce6f-42eb-b758-ec73f9de4852';

UPDATE stations SET name = 'WUAL- Alabama Public Radio "XPoNential Radio"', streams = '[{"url":"http://18183.live.streamtheworld.com/WUAL_HD2_SC","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://wxpn.xpn.org/xpomp3hi","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '962626a4-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://18183.live.streamtheworld.com/WUAL_HD2_SC', 'https://wxpn.xpn.org/xpomp3hi') AND id != '962626a4-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Punk Rock Demonstration', streams = '[{"url":"https://radio.punkrockdemo.com/listen.pls","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://stream.punkrockers-radio.de:8443/prr.ogg","bitrate":128,"format":"ogg","label":"Standard"}]'::jsonb WHERE id = '05412426-3d22-4e8e-bee0-92b71dac20ff';
DELETE FROM stations WHERE stream_url IN ('https://radio.punkrockdemo.com/listen.pls', 'https://stream.punkrockers-radio.de:8443/prr.ogg') AND id != '05412426-3d22-4e8e-bee0-92b71dac20ff';

UPDATE stations SET name = 'Sharks Audio Network', streams = '[{"url":"http://sjsharks.streamguys1.com/sharks-player.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://sjsharks.streamguys1.com/sharks-player","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '6e4afd5b-6687-437a-874f-79af1a15f4b8';
DELETE FROM stations WHERE stream_url IN ('http://sjsharks.streamguys1.com/sharks-player.mp3', 'https://sjsharks.streamguys1.com/sharks-player') AND id != '6e4afd5b-6687-437a-874f-79af1a15f4b8';

UPDATE stations SET name = 'KSVG - Savage Radio', streams = '[{"url":"https://ksvg.streamguys1.com:80/live","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ais-edge103-live365-dal02.cdnstream.com/a68405","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9bdf000a-a0fa-4ea7-b1e6-18054c29e0d7';
DELETE FROM stations WHERE stream_url IN ('https://ksvg.streamguys1.com:80/live', 'https://ais-edge103-live365-dal02.cdnstream.com/a68405') AND id != '9bdf000a-a0fa-4ea7-b1e6-18054c29e0d7';

UPDATE stations SET name = 'Hawaiian Rainbow', streams = '[{"url":"http://stream1.hawaiianrainbow.com/","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://fwd.autopo.st/hawaiianrainbow/;stream.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'bb136406-1319-11ea-a87e-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://stream1.hawaiianrainbow.com/', 'https://fwd.autopo.st/hawaiianrainbow/;stream.mp3') AND id != 'bb136406-1319-11ea-a87e-52543be04c81';

UPDATE stations SET name = 'Hawaii', streams = '[{"url":"http://khpr-ice.streamguys1.com/khpr2","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://khpr-ice.streamguys1.com/kipo2","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '96232d01-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://khpr-ice.streamguys1.com/khpr2', 'http://khpr-ice.streamguys1.com/kipo2') AND id != '96232d01-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'Ukulele Island', streams = '[{"url":"https://tunein-ondemand.cdnstream1.com/multi_bump_sonic_pre_pre.mp3?aw_0_1st.playerid=LogitechSqueeze&aw_0_1st.skey=1768433575&aw_0_1st.abtest=&partnerId=LogitechSqueeze&aw_0_1st.stationId=s205522&aw_0_1st.premium=false&source=TuneIn&aw_0_req.gdpr=true&aw_0_1st.platform=tunein&aw_0_1st.ads_partner_alias=ce.LogitechSqueezebox&aw_0_azn.planguage=en&aw_0_1st.is_ondemand=false&aw_0_1st.topicId=na&aw_0_1st.affiliateIds=a40075%2ca40276&aw_0_1st.bandId=16","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://s3.voscast.com:8662/","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '36b2caa4-41e0-11e9-aa55-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('https://tunein-ondemand.cdnstream1.com/multi_bump_sonic_pre_pre.mp3?aw_0_1st.playerid=LogitechSqueeze&aw_0_1st.skey=1768433575&aw_0_1st.abtest=&partnerId=LogitechSqueeze&aw_0_1st.stationId=s205522&aw_0_1st.premium=false&source=TuneIn&aw_0_req.gdpr=true&aw_0_1st.platform=tunein&aw_0_1st.ads_partner_alias=ce.LogitechSqueezebox&aw_0_azn.planguage=en&aw_0_1st.is_ondemand=false&aw_0_1st.topicId=na&aw_0_1st.affiliateIds=a40075%2ca40276&aw_0_1st.bandId=16', 'http://s3.voscast.com:8662/') AND id != '36b2caa4-41e0-11e9-aa55-52543be04c81';

UPDATE stations SET name = 'Ancient Faith Radio - English Talk', streams = '[{"url":"https://ancientfaith.streamguys1.com/talk","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://ancientfaith.streamguys1.com/music","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '2ad685a8-a656-4a8b-945b-a09569283fdd';
DELETE FROM stations WHERE stream_url IN ('https://ancientfaith.streamguys1.com/talk', 'https://ancientfaith.streamguys1.com/music') AND id != '2ad685a8-a656-4a8b-945b-a09569283fdd';

UPDATE stations SET name = 'WWOZ', streams = '[{"url":"https://www.wwoz.org/listen/hi","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://wwoz-sc.streamguys1.com/wwozhd2-hi","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '9ceb61e8-5101-11e9-a4d7-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('https://www.wwoz.org/listen/hi', 'https://wwoz-sc.streamguys1.com/wwozhd2-hi') AND id != '9ceb61e8-5101-11e9-a4d7-52543be04c81';

UPDATE stations SET name = 'KCMP', streams = '[{"url":"http://radioheartland.stream.publicradio.org/radioheartland.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://rockthecradle.stream.publicradio.org/rockthecradle.mp3","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '960862ef-0601-11e8-ae97-52543be04c81';
DELETE FROM stations WHERE stream_url IN ('http://radioheartland.stream.publicradio.org/radioheartland.mp3', 'http://rockthecradle.stream.publicradio.org/rockthecradle.mp3') AND id != '960862ef-0601-11e8-ae97-52543be04c81';

UPDATE stations SET name = 'I Hate Free Speech Radio', streams = '[{"url":"https://s22.myradiostream.com/15152/listen.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://s22.myradiostream.com:15152/stream","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '7428f0e4-2c80-4c2a-8659-307a3730e270';
DELETE FROM stations WHERE stream_url IN ('https://s22.myradiostream.com/15152/listen.mp3', 'http://s22.myradiostream.com:15152/stream') AND id != '7428f0e4-2c80-4c2a-8659-307a3730e270';

UPDATE stations SET name = 'Jefferson Public Radio', streams = '[{"url":"http://jpr.streamguys.org/jpr-rhythm","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://jpr-ice.streamguys1.com/jpr-rhythm","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '7ccafc0f-e360-468f-aefe-99b88c3f2299';
DELETE FROM stations WHERE stream_url IN ('http://jpr.streamguys.org/jpr-rhythm', 'https://jpr-ice.streamguys1.com/jpr-rhythm') AND id != '7ccafc0f-e360-468f-aefe-99b88c3f2299';

UPDATE stations SET name = 'VivaLaVoce', streams = '[{"url":"https://playerservices.streamtheworld.com/api/livestream-redirect/WETAVLV.mp3","bitrate":128,"format":"mp3","label":"Standard"},{"url":"https://weta.streamguys1.com/wetavivalavoce-icy","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = '27ef53a9-04d1-4f18-ad2c-bb6eb13bf483';
DELETE FROM stations WHERE stream_url IN ('https://playerservices.streamtheworld.com/api/livestream-redirect/WETAVLV.mp3', 'https://weta.streamguys1.com/wetavivalavoce-icy') AND id != '27ef53a9-04d1-4f18-ad2c-bb6eb13bf483';

UPDATE stations SET name = 'Philip IPTV Fire Radio', streams = '[{"url":"http://server.philipiptv.cloudns.ph:8082/fire","bitrate":128,"format":"mp3","label":"Standard"},{"url":"http://philipiptv.freeddns.org:8082/fire-wind-lake","bitrate":128,"format":"mp3","label":"Standard"}]'::jsonb WHERE id = 'c4a6fd09-e205-4c1e-a28f-7396ebec39c2';
DELETE FROM stations WHERE stream_url IN ('http://server.philipiptv.cloudns.ph:8082/fire', 'http://philipiptv.freeddns.org:8082/fire-wind-lake') AND id != 'c4a6fd09-e205-4c1e-a28f-7396ebec39c2';

