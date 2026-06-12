-- Corregir el typo "Repupblica Checa" -> "República Checa"
begin;

update matches
set home_team = 'República Checa'
where home_team = 'Repupblica Checa';

update matches
set away_team = 'República Checa'
where away_team = 'Repupblica Checa';

commit;