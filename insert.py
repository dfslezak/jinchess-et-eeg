#! /usr/bin/python
# -*- coding: utf-8 -*-

import sys, psycopg2
import datetime
from pgn import parsePGN
from accessDB import *
from socket_utils import read_all,wait_for_writing

def get_computer(sock,user):
	wait_for_writing(sock,'finger ' + str(user) + '\n')
	finger = read_all(sock)
	finger = finger[0:finger.index(':')]
	try:
		finger.index('(C)')
		return 'true'
	except:
		return 'false'


def insertGame(conn,pgn_text):
	try:
		parsed = parsePGN(pgn_text)
	except:
		print "ERROR parsing game. Game text is:" 
		print pgn_text
		read_all(s)
		return

	# print "Parsed " + str(len(parsed)) + " games.";
	print "Game text: " + pgn_text + "\n"
	print "Parsed game: " + str(parsed)
	
	for game in parsed:
		# Start database transaction...
		cur = conn.cursor()

		try:
			# Read Header
			header= game[0].asList()
			print header
			
			if not ('Event' in header):
				game_type = -1
			else:
				if (header[header.index('Event') +1]=='rated blitz match'):
					game_type = 0
				elif (header[header.index('Event') +1]=='rated lightning match'):
					game_type = 1
				if (header[header.index('Event') +1]=='unrated blitz match'):
					game_type = 10
				elif (header[header.index('Event') +1]=='unrated lightning match'):
					game_type = 11
			server = header[header.index('Site') + 1]
			print server
			white = header[header.index('White') + 1]
			black = header[header.index('Black') + 1]
			white_elo = header[header.index('WhiteElo') + 1]
			black_elo = header[header.index('BlackElo') + 1]
			print black_elo
			game_eco = header[header.index('ECO') + 1]
			game_result = header[header.index('Result') + 1]
			game_end = header[header.index('End') + 1]
			print game_end
			
			game_result_comment = game[-1][0]
			print game_result_comment
		
			date = datetime.datetime.strptime(header[header.index('Date') + 1],'%Y-%m-%d %H:%M:%S')
			print date
			
			timecontrol = header[header.index('TimeControl') + 1]
			print timecontrol
			timecontrol = timecontrol.split("+")
			total_time = timecontrol[0]
			print total_time
			if len(timecontrol) == 2:
				increment = timecontrol[1]
			else:
				increment = 0
		
			game_edfName = header[header.index('EDFname') + 1]
			print game_edfName
			print 'Adding ' + ('lr' if (game_type==1) else 'br') + ' game from server ' + server + ' with white player "' + white + '" (elo: ' + str(white_elo) + ') and black player "' + black + '" (elo: ' + str(black_elo) + ') played on ' + str(date) + ' with total time (increment) = ' + str(total_time) + '(' + str(increment) + ').'
		except:
			print "ERROR processing header." 
			return

		try:
			# Check for white player
			w_user = db_getUserId(cur,white,server)
			if w_user==-1:
				# We have to add white user to database.
				# but first get users details. Is it a computer?
				is_computer = False
				print "-- Inserting white player: " + white
				w_user = db_insertPlayer(cur,white,server,is_computer)
				#w_user = db_getUserId(user_dict,cur,white,server)
		
			# Check for black player.
			b_user = db_getUserId(cur,black,server)
			if b_user==-1:
				# We have to add black user to database.
				# but first get users details. Is it a computer?
				is_computer = False
				print "-- Inserting black player: " + black
				b_user = db_insertPlayer(cur,black,server,is_computer)
				#b_user = db_getUserId(user_dict,cur,black,server)
		except:
			print "ERROR checking users." 
			conn.rollback()
			return

#		try:
			# Insert game
		game_id = db_insertGame(cur,date,w_user,b_user,game_type,total_time,increment,white_elo,black_elo,game_eco,game_result,game_result_comment, game_end,game_edfName)
		#except:
			#print "ERROR inserting game (not moves, only game)." 
			#conn.rollback()
			#return
	    
		try:
			# Insert moves
			moves = game[1]
			#print moves
		
			for move in moves:
				# White move
				w_b = 0
				move_number = move[0]
				move_type = move[1][0][0]
				if len(move[1][0])==2:
					time_left = (move[1][0][1])
				else:
					time_left = NULL

				if (move_number == '1'):
					move_duration = 0
					lastTimeLeft_white = float(time_left)
				else:
					move_duration = lastTimeLeft_white - float(time_left)
					lastTimeLeft_white = float(time_left)
			
				recentInsertedMove = db_insertMove(cur,game_id,time_left,move_type,move_number,w_b,move_duration)

				# Black Move
				if len(move[1][1])>0:
					w_b = 1
					move_type = move[1][1][0]
					if len(move[1][1])==2:
						time_left = (move[1][1][1])
					else:
						time_left = NULL

					if (move_number == '1'):
						move_duration = 0
						lastTimeLeft_black = float(time_left)
					else:
						move_duration = lastTimeLeft_black - float(time_left)
						lastTimeLeft_black = float(time_left)

					recentInsertedMove = db_insertMove(cur,game_id,time_left,move_type,move_number,w_b,move_duration)
		except:
			print "ERROR inserting moves." 
			conn.rollback()
			return
		else:
			#Once every move has been added, commit transaction.
			conn.commit()
			
	
	return game_id


