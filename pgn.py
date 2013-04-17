# -*- coding: utf-8 -*-
# pgn.py rel. 1.1 17-sep-2004
#
# Demonstration of the parsing module, implementing a pgn parser.
#
# The aim of this parser is not to support database application,
# but to create automagically a pgn annotated reading the log console file
# of a lecture of ICC (Internet Chess Club), saved by Blitzin.
# Of course you can modify the Abstract Syntax Tree to your purpose.
#
# Copyright 2004, by Alberto Santini http://www.albertosantini.it/chess/
#
from pyparsing import alphanums, nums, quotedString
from pyparsing import Combine, Forward, Group, Literal, oneOf, OneOrMore, Optional, Suppress, ZeroOrMore, White, Word
from pyparsing import ParseException

#
# define pgn grammar
#

#tag = Suppress("[") + Word(alphanums) + quotedString + Suppress("]")
tag = Suppress("[") + Word(alphanums) + Suppress(Literal('"')) + Combine(Word(alphanums + " .-@?+/*:")) + Suppress(Literal('"')) + Suppress("]")
#command = Combine(Suppress(Literal("[%")) + Optional(Word(alphanums + " -.")) + Suppress("]"))
comment = Combine(Suppress("{") + Word(alphanums + " -.") + Suppress("}"))
show_comment = Combine(Suppress("{") + Optional(Word(alphanums + " ")) + Suppress("}"))

dot = Literal(".")
piece = oneOf("K Q B N R")
file_coord = oneOf("a b c d e f g h")
rank_coord = oneOf("1 2 3 4 5 6 7 8")
capture = oneOf("x :")
promote = Literal("=")
castle_queenside = Literal("O-O-O") | Literal("0-0-0") | Literal("o-o-o")
castle_kingside = Literal("O-O") | Literal("0-0") | Literal("o-o")

move_number = Suppress(Optional(comment)) + Word(nums) + Suppress(dot)
promotion1 = file_coord + Optional(oneOf("8 1")) + promote + piece # pawn promotion e.g. e8=Q
promotion2 = file_coord + capture + file_coord + Optional(oneOf("8 1")) + promote + piece # pawn promotion e.g. hxg8=Q+
m1 = file_coord + rank_coord # pawn move e.g. d4
m2 = file_coord + capture + file_coord + rank_coord # pawn capture move e.g. dxe5
m4 = piece + file_coord + rank_coord # piece move e.g. Be6
m5 = piece + file_coord + file_coord + rank_coord # piece move e.g. Nbd2
m6 = piece + rank_coord + file_coord + rank_coord # piece move e.g. R4a7
m7 = piece + capture + file_coord + rank_coord # piece capture move e.g. Bxh7
m8 = piece + rank_coord + capture + file_coord + rank_coord # piece capture move e.g. B4xh7
m9 = piece + file_coord + capture + file_coord + rank_coord # piece capture move e.g. Ngxe5
m10 = castle_queenside | castle_kingside # castling e.g. o-o

check = oneOf("+ ++")
mate = Literal("#")
annotation = Word("!?", max=2)
nag = " $" + Word(nums)
decoration = check | mate | annotation | nag

variant = Forward()
half_move = Combine((promotion1 | promotion2 | m1 | m2 | m4 | m5 | m6 | m7 | m8 | m9 | m10) + Optional(decoration)) + Optional(comment)
move = move_number + Group(Group(half_move) + Group(Optional(half_move)))
variant << Group("(" + OneOrMore(move) + ")")
game_terminator = Optional(show_comment) + oneOf("1-0 0-1 1/2-1/2 *")

game = Group(ZeroOrMore(tag))  + Group(ZeroOrMore(Group(move))) + Group(game_terminator)

pgnGrammar = ZeroOrMore(Group(game))

def parsePGN( pgn, bnf=pgnGrammar, fn=None ):
  
  try:
    return bnf.parseString( pgn )
  except ParseException, err:
    print err.line
    print " "*(err.column-1) + "^"
    print err

def parsePGNfile(fileName):

  in_file = open(fileName, "r")
  text = in_file.read()
  in_file.close()

  return parsePGN(text);


def sql2pgn(cur, id_game):
	# Constants for MOVES
	COLUMNS=6
	ID_GAME=0
	ID_MOVE=1
	MOVE_NUMBER=2
	W_B=3
	MOVE_TYPE=4
	DURATION=5
	
	# Constants for GAMES
	ID_GAME=0
	W_USER=1
	B_USER=2
	TOTAL_TIME=3
	INCREMENT=4
	TIMESTAMP=7
	RESULT=9
	RESULT_COMMENT=10
	
	# Constants for USERS
	ID_USER=0
	USERNAME=1
	SERVER=2
	IS_COMPUTER=3

	statement = "SELECT * FROM games WHERE id_game="+str(id_game)
	cur.execute(statement)
	game = cur.fetchone()

	statement = "SELECT * FROM users WHERE id_user="+str(game[W_USER])
	cur.execute(statement)
	w_user = cur.fetchone()[USERNAME]
	
	statement = "SELECT * FROM users WHERE id_user="+str(game[B_USER])
	cur.execute(statement)
	b_user = cur.fetchone()[USERNAME]

	statement = "SELECT game, id_move, move_number, w_b, move_type,duration FROM moves WHERE game="+str(id_game)+"ORDER BY move_number,w_b"
	cur.execute(statement)
	moves = cur.fetchall()
	
	tags  = "[Event \"rated blitz match\"]\n"
	tags += "[Site \"Free Internet Chess Server\"]\n"
	tags += "[IdGame \"" + str(id_game) + "\"]\n"
	tags += "[White \"" + str(w_user) + "\"]\n"
	tags += "[Black \"" + str(b_user) + "\"]\n"
	tags += "[Date \"" + str(game[TIMESTAMP]) + "\"]\n"
	tags += "[TimeControl \"" + str(int (game[TOTAL_TIME]*60)) + '+' + str(int (game[INCREMENT])) + "\"]\n"
	tags += "[LongResult \"" + game[RESULT_COMMENT] + "\"]\n"
	
	white_time_left = float(game[TOTAL_TIME])*60
	black_time_left = float(game[TOTAL_TIME])*60
	increment = float(game[INCREMENT])
	
	move_line = ''
	for row in moves:
		if len(row) != COLUMNS:
			print 'There is a problem with row #' + str(row_number) + "."
			exit(0)

		
			
		if (row[W_B] == '1'):
			black_time_left = black_time_left - (row[DURATION])
			# move_line += str(row[MOVE_TYPE]) + ' {[%clkms ' + str(black_time_left) 
			move_line += str(row[MOVE_TYPE]) + ' ' # + ' {' + str(row[DURATION]) 
		if (row[W_B] == '0'):
			white_time_left = white_time_left - (row[DURATION])
			# move_line += str(row[MOVE_NUMBER]) + '. ' + row[MOVE_TYPE] + ' ' + ' {[%clkms ' + str(white_time_left) 
			move_line += str(row[MOVE_NUMBER]) + '. ' + row[MOVE_TYPE] + ' ' # + ' {' + str(row[DURATION]) 
		# move_line += ']]} '
		# move_line += '} '
			
	return tags + "\n" + move_line # + game[RESULT] + ' {' + game[RESULT_COMMENT] + '}'

if __name__ == "__main__":
  # input string
  pgn = """
[Event "ICC 5 0 u"]
[Site "Internet Chess Club"]
[Date "2004.01.25"]
[Round "-"]
[White "guest920"]
[Black "IceBox"]
[Result "0-1"]
[ICCResult "White checkmated"]
[BlackElo "1498"]
[Opening "French defense"]
[ECO "C00"]
[NIC "FR.01"]
[Time "04:44:56"]
[TimeControl "300+0"]

1. e4 e6 2. Nf3 d5 $2 3. exd5 (3. e5 g6 4. h4) exd5 4. Qe2+ Qe7 5. Qxe7+ Bxe7 6. d3 Nf6 7. Be3
Bg4 8. Nbd2 c5 9. h3 Be6 10. O-O-O Nc6 11. g4 Bd6 12. g5 Nd7 13. Rg1 d4 14.
g6 fxg6 15. Bg5 Rf8 16. a3 Bd5 17. Re1+ Nde5 18. Nxe5 Nxe5 19. Bf4 Rf5 20.
Bxe5 Rxe5 21. Rg5 Rxe1# {Black wins} 0-1
"""
  # parse input string
  tokens = parsePGN(pgn, pgnGrammar)
  print "tokens = ", tokens
