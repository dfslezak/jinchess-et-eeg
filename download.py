#! /usr/bin/python
# -*- coding: utf-8 -*-

import sys, time, datetime, os, locale, webbrowser # , base64
from socket import *
from socket_utils import wait_for_writing,read_all,read_all_long
import select
from pyparsing import alphas, alphanums, nums, quotedString
from pyparsing import Combine, Forward, Group, Literal, oneOf, OneOrMore, Optional, Suppress, ZeroOrMore, White, Word

os.system('cd')

import psycopg2 
import accessDB
import pgn
import insert


separator = Literal('^') | Literal('~') | Literal(':') | Literal('#') | Literal('.') | Literal('&') | Literal(' ')
username = Combine(Word(alphanums) + Suppress(Optional('(C)') + Optional('(TD)') + Optional('(FM)') + Optional('(*)') + Optional('(CA)') + Optional('(SR)') + Optional('(TM)') + Optional('(B)') + Optional('(IM)') + Optional('(D)') + Optional('(GM)')))
elo = Word(nums)
ficsUserGrammar = ZeroOrMore(Combine(Suppress(elo) + Suppress(separator) + username))

# gameCode = oneOf('br bu Br nu Lr lr lu sr su Sr wr zr zu')
gameCode = Word(alphas)
gameType = Suppress(Literal('[')) + gameCode + Word(nums) + Combine(Word(nums) + Suppress(']'))
result = oneOf('+ - =')
gameDate = Word(alphas) + Word(alphas) + Combine(Word(nums)+Literal(',')) + Combine(Word(nums)+Literal(':')+Word(nums)) + Word(alphas) + Word(nums)
historygame = Combine(Word(nums) + Suppress(separator)) + result + Word(nums) + oneOf('W B') + Word(nums) + Word(alphanums) + Group(gameType) + Word(alphanums + "-*") + Word(alphanums) + Group(gameDate)

historyOutput = OneOrMore(Group(historygame)) + Suppress('fics%')

MAX_TRIES = 5


# Constant to access list from parser.
GAME_TYPE=6
GAME_DATE=9
GAME_OPPONENT=5
GAME_USER_ELO=2
GAME_OPPONENT_ELO=4
GAME_ECO=7
GAME_END=8

def main(*args):
  
	player = args[1]
	edfName = args[2]

	# Connect to Chess Database
	database='chessExperiment'
	host='calamaro.exp.dc.uba.ar'
	user='dfslezak'
	password='23571113'
	connectStr="dbname='"+database+"' user='"+user+"' host='"+host+"' password='"+password+"'"
	try:
		conn = psycopg2.connect(connectStr)
	except:
		print "I am unable to connect to the database"
		exit(0)
	print "Connected to database " + database + " on host " + host + " with user " + user + "."

	cur = conn.cursor()

	# Setting locale to en_US
	#print 'Setting locale to en_US...'
	#locale.setlocale(locale.LC_ALL, 'en_US')

	# Connect to FreeChess
	s = socket(AF_INET, SOCK_STREAM)
	s.connect(("freechess.org", 23))
	server = "freechess.org"

	# Get console presentation.
	pres = read_all_long(s,3)
	#print pres

	# Send login user
	wait_for_writing(s,'guest\n')
	read_all(s)

	# Accept user suggested
	wait_for_writing(s,'\n')
	read_all(s)

	time.sleep(1)

	# Stop messages and Set time in msec
	wait_for_writing(s,'set seek 0\nset open 0\nset shout 0\nset cshout 0\nset silence 1\nset echo 0\nset tell 0\nset ctell 0\nset chanoff 1\nset pin 0\nset gin 0\nset bell 0\niset ms 1\n')
	read_all(s)

	# Look for history, parse it and check games...
	tries=0
	found_history = False
	while tries<MAX_TRIES and not found_history:
		# Get player history
		wait_for_writing(s,'history ' + player + '\n' )
		h = read_all(s)
		#print h
		
		try:
			h = h[(h.index('Date')+5):].strip()
			h = (historyOutput.parseString(h)).asList()
			if not 'fics%' in h: found_history = True
		except:
			tries = tries + 1
			print "Retry " + str (tries) + " --- ERROR: Didn't find Date in history: " + str(h)
			read_all(s)
	if not found_history: 
		print "ERROR: Didn't find Date in history: " + str(h)
		exit(0)

	num_game = 0
	
	# Save ONLY last game.
	game = h[len(h)-1]
	# Check if game is already loaded in database.
	B_or_W = game[3]
	if (B_or_W == 'B'):
		black_user = player
		black_elo = game[GAME_USER_ELO]
		white_user = game[GAME_OPPONENT]
		white_elo = game[GAME_OPPONENT_ELO]
	else:
		white_user = player
		white_elo = game[GAME_USER_ELO]
		black_user = game[GAME_OPPONENT]
		black_elo = game[GAME_OPPONENT_ELO]
  
	date_string = game[GAME_DATE][1] + ' ' + game[GAME_DATE][2] +' ' + game[GAME_DATE][3] + ' ' + game[GAME_DATE][5]
	#print date_string
	timeStamp = datetime.datetime.strptime(date_string, '%b %d, %H:%M %Y' )
	
	id_game = accessDB.db_getGameId(cur,white_user,black_user,server,timeStamp)
  
	# If there is an ID in the DB, skip game.
	if (id_game!=-1):
		print 'Game from ' + player + ' already loaded in database, skipping ...'
		pgn_text = pgn.sql2pgn(cur,id_game)
	else:
		# If not in DB, add it...
		tries = 0
		found_moves = False
		while tries<MAX_TRIES and not found_moves:
			# Get moves of each unloaded interesting game
			wait_for_writing(s,'smoves ' +player + ' ' + game[0] + '\n' )
			moves = read_all(s)
			#print moves

			# Check that game has not disappeared.
			# If game has disappeared, we receive something like 'There is no history game 33 for ciggao.'
			splited = moves.split()

			try:
				splited=splited[splited.index('Move')+6:]
				if not 'seeking' in splited and not '**ANNOUNCEMENT**' in splited:
					found_moves = True
			except:
				tries = tries + 1
				print "ERROR: Didn't find Move in splited: " + str(splited)
				read_all(s)
			
		if not found_moves: 
			print "ERROR: Didn't find Moves after " + str(MAX_TRIES) + " tries."
			exit(0)
		
		# Remove 'fics%'
		splited = splited[:-1]
    
		# Write game in pgn format.
    		pgn_text = ''
		if (game[GAME_TYPE][0]=='br'):
			pgn_text += '[Event "rated blitz match"]\n'
		elif (game[GAME_TYPE][0]=='lr'):
			pgn_text += '[Event "rated lightning match"]\n'
		elif (game[GAME_TYPE][0]=='lu'):
			pgn_text += '[Event "unrated lightning match"]\n'
		elif (game[GAME_TYPE][0]=='bu'):
			pgn_text += '[Event "unrated blitz match"]\n'
		pgn_text += '[Site "'+server+'"]\n';
		pgn_text += '[Date "'+str(timeStamp)+'"]\n';
		pgn_text += '[Round "?"]\n';
		pgn_text += '[White "'+white_user+'"]\n';
		pgn_text += '[Black "'+black_user+'"]\n';
		pgn_text += '[Result "' + splited[-1] +'"]\n';
		pgn_text += '[WhiteElo "'+white_elo+'"]\n';
		pgn_text += '[BlackElo "'+black_elo+'"]\n';
		pgn_text += '[ECO "'+game[GAME_ECO]+'"]\n';
		pgn_text += '[End "'+game[GAME_END]+'"]\n';
		pgn_text += '[EDFname "'+str(edfName)+'"]\n';
		pgn_text += '[LongResult "'+moves[moves.find("{")+1:moves.find("}")]+'"]\n';
    
		if (game[GAME_TYPE][2]==0):
			pgn_text += '[TimeControl "'+game[GAME_TYPE][1]+'"]\n';
		else:
			pgn_text += '[TimeControl "'+game[GAME_TYPE][1]+'+'+game[GAME_TYPE][2]+'"]\n';
    
		try:
			# Get final comment from splited
			i=len(splited)-1
			fin = False

			while (not fin):
				if (not splited[i].find('{')==-1):
					fin=True
				i = i -1
      
			j=0
			white_time_left = float(game[GAME_TYPE][1])*60*1000
			black_time_left = float(game[GAME_TYPE][1])*60*1000
			increment = float(game[GAME_TYPE][2])*1000
			while(j<i):
				j=j+1
				j=j+1

				# I'm at white move. Convert to number and save it.
				minutes = int(splited[j][1:-1].split(':')[0])
				seconds = int(splited[j][1:-1].split(':')[1].split('.')[0])
				miliseconds = int(splited[j][1:-1].split(':')[1].split('.')[1])
				white_time_left = white_time_left - (minutes*60*1000+seconds*1000+miliseconds) + increment
				# splited[j] = '{[%clkms '+str(white_time_left)+']}'
				splited[j] = '{'+str(white_time_left)+'}'
				
				j=j+1
				
				# Now I'm at black move. Check if game hasn't finish. Convert to number and save it.
				
				if (splited[j].find('{')==-1):
					j=j+1
					minutes = int(splited[j][1:-1].split(':')[0])
					seconds = int(splited[j][1:-1].split(':')[1].split('.')[0])
					miliseconds = int(splited[j][1:-1].split(':')[1].split('.')[1])
					black_time_left = black_time_left - (minutes*60*1000+seconds*1000+miliseconds) + increment
					# splited[j] = '{[%clkms '+str(black_time_left)+']}'
					splited[j] = '{'+str(black_time_left)+'}'
				else:
					j=j+1
				j=j+1
        
			pgn_text += ' '.join(splited)
			num_game = num_game + 1
		except:
			print "ERROR converting times. Game text is:" 
			print str(splited)
			read_all(s)
			exit(0)
		else:  
			# print 'Game from player ' + player + ' with opponent ' + game[GAME_OPPONENT] + ' played on ' + date_string + ' saved.'
			id_game = insert.insertGame(conn,pgn_text)

	if (B_or_W == 'B'): id_user = accessDB.db_getUserId(cur,black_user,server)
	else: id_user = accessDB.db_getUserId(cur,white_user,server)

	print pgn_text
	pgn_text = pgn_text.replace("\n","")
	# pgn_text = pgn_text.replace("[%clkms ","")
	# pgn_text = pgn_text.replace("]}","}")
	# webbrowser.open("http://calamaro.exp.dc.uba.ar/chessExperiment/show.php?id_game="+str(id_game)+"&id_user="+str(id_user)+"&pgn_text="+str(base64.b64encode(pgn_text)))
	webbrowser.open("http://calamaro.exp.dc.uba.ar/chessExperiment/show.php?id_game="+str(id_game)+"&id_user="+str(id_user))
	s.close()

if __name__ == '__main__':
	sys.exit(main(*sys.argv))
