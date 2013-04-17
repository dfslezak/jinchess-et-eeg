#! /usr/bin/python -u
# -*- coding: utf-8 -*-

# -----------------------------------------------------------------------------
# Usar la version en 32 bits de Java
# (por alguna razon la version de 64 bits no esta andando bien)
#
#   cd C:\Program Files (x86)\Jin
#   C:\Program Files (x86)\Java\jre6\bin\java -jar jin.jar \
#       | C:\Python24\python -u hook.py
#
# -----------------------------------------------------------------------------

import webbrowser
# para poder usar el "standard input"
import sys
# para generar nombres de archivos al azar
import string
import random
# para detectar el OS
import platform
# para llamar a "download.py"
import os
# linea a utilizar para llamar a download.py
download_line = {"Windows"   : 'C:\Python27\Python -u C:\Experimento\download.py',
                 "Linux"     : "/usr/bin/python -u  ~/repos/neurociencia/ajedrez/codigo/setupExperimental/download.py"} [platform.system ()]

destPath = {"Windows"   : "C:\\Chess\\datos\\",
            "Linux"     : "~/repos/neurociencia/ajedrez/experimentos/datos/"} [platform.system ()]

global LPTPortNum, lag_time, code_reset, code_white, code_black, code_gamestarted, code_gamecancelled, code_gameended, white_turn

# Nombre de archivo para guardar datos de ET
# edf_filename = ''

# numero del puerto LPT
LPTPortNum = 0x378

# tiempo a esperar entre el codigo y el reset
lag_time = 0.03

# deshabilitar eyetracker
disable_eyetracker = 1

# deshabilitar puerto serie (solo utilizado para NIRS)
disable_serial_port = 1

# para comunicarse con el puerto paralelo
import ctypes

# para comunicarse con el puerto serie
if not disable_serial_port:
    import serial

# para generar un delay
import time

# para configurar y usar el eyetracker
if not disable_eyetracker:
    import eyetracker
    global eyetracker, tracker_software_ver , eyelink_ver, edf_filename

if not disable_serial_port:
    global serialPort

# numero de reset
code_reset = 0

# codigo de cada turno
code_white = 1
code_black = 2
code_mousepressed = 4
code_mousereleased = 8
code_gamestarted = 32
code_gamecancelled = 16
code_gameended = 64


def sendLPT(code):
    global LPTPortNum, lag_time, code_reset
    # Mandar el codigo...
    ctypes.windll.inpout32.Out32 (LPTPortNum, code)
    # ...esperar el lag...
    time.sleep(lag_time)
    # ...mandar el reset
    ctypes.windll.inpout32.Out32 (LPTPortNum, code_reset)

    return


def sendSerialPort(code):
    global serialPort

    ser.write(code)

    return


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #  Funciones a aplicar en cada caso # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

white_turn = None


def userFound ():
    # declarar los globales que vayamos a usar
    global user

    # aca habra que hacer alguna magia
    print ">>>>>>>>>>>>>>> USER " + user + " <<<<<<<<<<<<<<<"

    # Initialize eye tracker. Asks for ET version and send some parsing commands.
    if not disable_eyetracker:
        eyetracker.initializeEyeTracker()

        # Once ET is initialize, run calibration.
        eyetracker.prepareScreen()
        eyetracker.doSetup()
        eyetracker.closeScreen()

    return

# -----------------------------------------------------------------------------


def gameStarted ():
    # declarar los globales que vayamos a usar
    global state, white_turn, edf_filename, mouse_filename, mousefile, code_gamestarted

    # aca habra que hacer alguna magia
    print ">>>>>>>>>>>>>>> GAME STARTED <<<<<<<<<<<<<<<"

    # empezo el partido, aun no se movio nada
    state = 0
    # blancas mueven primero
    white_turn = True

    # Generate random names for mouse and eyetracker.
    chars = string.ascii_lowercase + string.digits
    rand_filename = ''.join([random.choice(chars) for i in range(8)])
    edf_filename = rand_filename + '.edf'
    mouse_filename = rand_filename + '.mme'

    # Open mouse file.
    mousefile = open(destPath + mouse_filename, 'w')

    # Open EDF file
    if not disable_eyetracker:
        eyetracker.openEDFfile(edf_filename)
        print 'Filename for this game: ' + str(edf_filename)

        # Start recording of eyetracker
        eyetracker.startRecording()

        eyetracker.printToEDFfile(">>>>>>>>>>>>>>> GAME STARTED <<<<<<<<<<<<<<<")

    # Send to serial and parallel port.
    sendLPT (code_gamestarted)
    if not disable_serial_port:
        sendSerialPort (code_gamestarted)

    return

# -----------------------------------------------------------------------------


def gameCancelled ():
    # declarar los globales que vayamos a usar
    global state, mouse_filename, mousefile, code_gamecancelled, destPath

    # aca habra que hacer alguna magia
    print ">>>>>>>>>>>>>>> GAME CANCELLED <<<<<<<<<<<<<<<"

    # terminamos con un juego
    state = None

    sendLPT (code_gamecancelled)
    if not disable_serial_port:
        sendSerialPort (code_gamecancelled)

    if not disable_eyetracker:
        eyetracker.printToEDFfile(">>>>>>>>>>>>>>> GAME CANCELLED <<<<<<<<<<<<<<<")

    mousefile.close()

    if not disable_eyetracker:
        eyetracker.stopRecording()
        eyetracker.closeEDFfile(destPath + edf_filename)

    return

# -----------------------------------------------------------------------------


def gameEnded ():
    # declarar los globales que vayamos a usar
    global download_line, user, state, edf_filename, code_gameended, destPath

    # aca habra que hacer alguna magia
    print ">>>>>>>>>>>>>>> GAME ENDED <<<<<<<<<<<<<<<"
    # llamamos a download.py
    # NODEBUG
    #os.system (download_line + ' ' + user + ' ' + edf_filename)
    webbrowser.open("https://docs.google.com/spreadsheet/viewform?pli=1&formkey=dENRdzBieU1ueUtfOUxIVkFEaWRYY2c6MQ#gid=0")
    # NODEBUG

    # terminamos con un juego
    state = None

    sendLPT (code_gameended)
    if not disable_serial_port:
        sendSerialPort (code_gameended)
    if not disable_eyetracker:
        eyetracker.printToEDFfile(">>>>>>>>>>>>>>> GAME ENDED <<<<<<<<<<<<<<<")

    mousefile.close()

    if not disable_eyetracker:
        eyetracker.stopRecording()
        eyetracker.closeEDFfile(destPath + edf_filename)

    return

# -----------------------------------------------------------------------------


def pieceMoved ():
    # declarar los globales que vayamos a usar
    global board_n, line, board_ini, state, code_white, white_turn, code_black

    # nos buscamos el tablero nuevo
    board_n = line [board_ini:board_end]

    # de una forma u otra, ya se movio al menos una pieza
    state = 1

    if state == 1:
        print ">>>>>>>>>>>>>>> PIECE MOVED <<<<<<<<<<<<<<<"
        print line

        if splitted[9] == 'B':
            white_turn = False
            msg = 'White moved: ' + str(splitted[-4]) + ' ' + str(splitted[-5])
        else:
            white_turn = True
            msg = 'Black moved: ' + str(splitted[-4]) + ' ' + str(splitted[-5])

        if white_turn:
            # If it's white_turn, then black player has made last move, and
            # so goes the mark to LPT
            sendLPT (code_black)
        else:
            sendLPT (code_white)

        if not disable_serial_port:
            sendSerialPort (code_white if white_turn else code_black)

        # Mandar mensaje al ET para marcar el evento.
        splitted = line.split()
        print splitted

        if not disable_eyetracker:
            eyetracker.printToEDFfile(msg)

        mousefile.write(line.strip() + '\n')

    return

# -----------------------------------------------------------------------------


def mouseMoved ():
    if 'MOUSE RELEASED' in line:
        sendLPT (code_mousereleased)
        if not disable_serial_port:
            sendSerialPort (code_mousereleased)
        if not disable_eyetracker:
            eyetracker.printToEDFfile("MOUSE RELEASED")
    if 'MOUSE PRESSED' in line:
        sendLPT (code_mousepressed)
        if not disable_serial_port:
            sendSerialPort (code_mousepressed)
        if not disable_eyetracker:
            eyetracker.printToEDFfile("MOUSE PRESSED")
        mousefile.write(line.strip() + '\n')

    return


# Inicialización del puerto serie.
if not disable_serial_port:
    serialPort = serial.Serial(0)
    print serialPort.portstr

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #  Configuracion de parseo  # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# nombre del usuario guest por defecto
guest = "guest"
# prefijo a buscar para encontrar el verdadero nombre del guest
guest_prefix = "Logging you in as \""
# sufijo a buscar para encontrar el verdadero nombre del guest
guest_suffix = "\"; you may"

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# prefijos que hay que buscar para saber que la linea corresponde a un movimiento
mov_prefix = ["<12>"]

# prefijos que hay que buscar para saber que la linea corresponde a un movimiento de mouse
mouse_prefix = ["<MouseEvent>"]

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# identificacion de lineas de informacion
#
#   lista de pares (<prefijo>, <sufijo>)
#
info_ident = [("{Game", "")]

# tipos de eventos
#
#   diccionario de substring en tipo de evento
#
info_event = {"Creating unrated untimed match"     : gameStarted  ,
              "Creating unrated lightning match"   : gameStarted  ,
              "Creating unrated blitz match"       : gameStarted  ,
              "Creating unrated standard match"    : gameStarted  ,
              "Creating rated blitz match"         : gameStarted  ,
              "Creating rated lightning match"     : gameStarted  ,
              "Creating rated standard match"      : gameStarted  ,
              #"Game aborted by mutual agreement"   : gameCancelled,
              "Game aborted"                       : gameCancelled,
              "Game adjourned by mutual agreement" : gameCancelled,
              "Game drawed by "                    : gameEnded    ,
              "Game drawn by "                     : gameEnded    ,
              #"Game drawed by mutual agreement"    : gameEnded    ,
              "resigns"                            : gameEnded    ,
              "checkmated"                         : gameEnded    ,
              "forfeits"                           : gameEnded    ,
              "Neither player has mating material" : gameEnded}

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# prefijos que hay que buscar para saber que se termino la joda
end_prefix = ["SENDING COMMAND: $quit"]


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #  Configuracion de estado  # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# donde inicia la descripcion del tablero en la linea de movimiento
board_ini = 5
# donde termina la descripcion del tablero en la linea de movimiento
board_end = 76

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# estado del log
#
#   N  no se empezo a jugar
#   0  se empezo a jugar, pero no se movieron piezas
#   1  se movio al menos una pieza
#
state = None


# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #  Cuerpo principal # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

# ignorar primera linea de la forma "SENDING COMMAND: %b00011001010101000100001001000001"
sys.stdin.readline ()
# buscar segunda linea con nombre de usuario "SENDING COMMAND: <user>"
user = sys.stdin.readline ().split () [-1]
#user = 'maquno'
# en caso de ser guest, buscar el nombre de sesion
if user in guest:
    while (True):
        line = sys.stdin.readline ()
        # si en esta linea esta el nombre completo...
        if line.startswith (guest_prefix):
            # ...extraer el nombre de ella
            user = line [len (guest_prefix):line.find (guest_suffix)]
            # terminamos de buscar el nombre de sesion del guest
            break

# reportar que hallamos al guest
userFound ()

# para cada linea en el log...
while (True):
    # tomar una linea de stdin
    line = sys.stdin.readline ()
    #print line

    # si la linea es de informacion...
    if any (map (lambda (p, s): line.startswith (p) and line[:-1].endswith (s), info_ident)):
        # ...buscar entre todos los substrings de eventos...
        for s in info_event.keys ():
            # ...hasta que uno aparezca, ...
            if s in line:
            # ...llamar a la funcion asociada...
                info_event [s] ()
                # ...y salir

    # si la linea no es de informacion, sino de movimiento...
    elif any (map (lambda x: line.startswith (x), mov_prefix)):
        # ...llamar a la funcion asociada
        pieceMoved ()

    # si la linea no de movimiento de piezas, puede ser de movimiento de mouse, siempre y cuando estemos en un partido...
    elif state != None and any (map (lambda x: line.startswith (x), mouse_prefix)):
        # ...llamar a la funcion asociada
        mouseMoved ()

    # si la linea es de finalizacion...
    elif (any (map (lambda x: line.startswith (x), end_prefix))):
        # ...salir exitosamente
        if not disable_eyetracker:
            eyetracker.closeEyetracker()
        quit (0)



# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# #  Para mandar datos por UDP  # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#
# import socket
#
# # This is an example of a UDP client - it creates
# # a socket and sends data through it
#
# # create the UDP socket
# UDPSock = socket.socket (socket.AF_INET, socket.SOCK_DGRAM)
#
# data = " jasjlsdfjk sdkldfkjlsd jlksfjklsd\n"
#
# # Simply set up a target address and port ...
# addr = ("localhost", 21567)
# # ... and send data out to it!
# UDPSock.sendto (data, addr)
#
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
