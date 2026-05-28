-- Script to delete the 9 non-Latin radio stations
DELETE FROM stations WHERE name IN (
  'Radio Rusrek Радио Русская Реклама 96.3 FM',
  'Канал "Музыка без слов" Radio Rusrek Радио Русская Реклама',
  'RadioMV Библия Новый Завет',
  'Голос Мира',
  'WKDM 纽约华语广播国语台',
  'Music of China 中国音乐',
  'WZRC 纽约华语广播粤语台',
  '라디오한국 Radio Hankook KSUH 1450 AM KWYZ 1230 AM',
  'Radio Hamrah رادیو همراه'
);
