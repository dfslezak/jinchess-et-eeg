#! /usr/bin/python
# -*- coding: utf-8 -*-

import psycopg2

def db_getGameId(cur, user1, user2, server, timeStamp):
	cur.execute("SELECT id_user FROM users WHERE username=%s AND server=%s",(user1,server))
	result = cur.fetchall()
	if len(result)==0: return -1 
	else: id_user1=result[0][0]
		
	cur.execute("SELECT id_user FROM users WHERE username=%s AND server=%s",(user2,server))
	result = cur.fetchall()
	if len(result)==0: return -1 
	else: id_user2=result[0][0]

	cur.execute("SELECT id_game FROM games WHERE w_user=%s AND b_user=%s AND timestamp=%s",(id_user1,id_user2,timeStamp))
	result = cur.fetchall()
	if len(result)==0: return -1 
	else: return result[0][0]

def db_insertGame(transactionCursor,date,w_user,b_user,game_type,total_time,increment,white_elo,black_elo,game_eco,game_result, game_result_comment,game_end,game_edfName):
  transactionCursor.execute("select nextval('games_id_game_seq'::regclass)")
  newid = transactionCursor.fetchone()[0]
  #print map(str,[newid,date,w_user,b_user,game_type,total_time,increment,white_elo,black_elo,game_end,game_result,game_result_comment,game_eco])
  transactionCursor.execute("INSERT INTO games (id_game,timestamp,w_user,b_user,game_type,total_time,increment,w_rating,b_rating,end_code,result,result_comment,eco,edfname) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(newid,date,w_user,b_user,game_type,total_time,increment,white_elo,black_elo,game_end,game_result,game_result_comment,game_eco,game_edfName))
 
  return newid

def db_insert(connection, table, columns, values):
  statement = 'INSERT INTO ' + table + ' (' + columns + ') VALUES (' + values + ') RETURNING id_user'
  mark = connection.cursor()
  mark.execute(statement)
  connection.commit()
  return

def db_insertPlayer(transactionCursor, user, server,is_computer):
  transactionCursor.execute("select nextval('users_id_user_seq'::regclass)")
  newid = transactionCursor.fetchone()[0]
  transactionCursor.execute('INSERT INTO users (id_user,username, server, is_computer) VALUES (%s,%s,%s,%s)',(newid,user,server,str(is_computer)))
  return newid

def db_insertMove(transactionCursor,game_id,time_left,move_type,move_number,w_b,move_duration):
  transactionCursor.execute("select nextval('moves_id_move_seq'::regclass)")
  newid = transactionCursor.fetchone()[0]
  transactionCursor.execute("INSERT INTO moves (id_move,game,time_left,move_type,move_number,w_b,duration) VALUES (%s,%s,%s,%s,%s,%s,%s)",(newid,game_id,time_left,move_type,move_number,str(w_b),move_duration))
  return newid

#def db_insertMoveDuration(transactionCursor,recentInsertedMove,move_duration):
#  transactionCursor.execute("INSERT INTO move_properties (move,duration) VALUES (%s,%s)",(recentInsertedMove,move_duration))
#  return 

def db_getUserId(transactionCursor, user, server):
	transactionCursor.execute("SELECT id_user FROM users WHERE username='"+user+"' AND server='"+server+"'")
	result = transactionCursor.fetchall()
	if len(result)==0: return -1
	else: return result[0][0]
