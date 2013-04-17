# -*- coding: utf-8 -*-
from pylink import *
#from pygame import *

tracker_software_ver = 0
eyetracker = 0
eyelink_ver = 0
current_edfFileName = ''

def initializeEyeTracker():
	global eyetracker, tracker_software_ver , eyelink_ver , current_edfFileName
	eyetracker = EyeLink()

	if eyetracker:

		pylink.flushGetkeyQueue(); 
		getEYELINK().setOfflineMode();                          


		eyelink_ver = getEYELINK().getTrackerVersion()
		if eyelink_ver == 3:
			tvstr = getEYELINK().getTrackerVersionString()
			vindex = tvstr.find("EYELINK CL")
			tracker_software_ver = int(float(tvstr[(vindex + len("EYELINK CL")):].strip()))

		if eyelink_ver>=2:
			getEYELINK().sendCommand("select_parser_configuration 0")
			if eyelink_ver == 2: #turn off scenelink camera stuff
				getEYELINK().sendCommand("scene_camera_gazemap = NO")
		else:
			getEYELINK().sendCommand("saccade_velocity_threshold = 35")
			getEYELINK().sendCommand("saccade_acceleration_threshold = 9500")

def prepareScreen():
	global eyetracker, tracker_software_ver , eyelink_ver , current_edfFileName

	# Initialize display and set resolution...
	#display.init()
	#display.set_mode((1024, 768), FULLSCREEN |DOUBLEBUF,32)
	pylink.openGraphics()
	#Gets the display surface and sends a mesage to EDF file;
	#surf = display.get_surface()
	
	#cmd = "screen_pixel_coords =  0 0 %d %d" %(surf.get_rect().w, surf.get_rect().h)
	#getEYELINK().sendCommand(cmd)
	#getEYELINK().sendMessage(cmd)


	# set link data (used for gaze cursor) 
	getEYELINK().sendCommand("link_event_filter = LEFT,RIGHT,FIXATION,SACCADE,BLINK,BUTTON")
	if tracker_software_ver>=4:
		getEYELINK().sendCommand("link_sample_data  = LEFT,RIGHT,GAZE,GAZERES,AREA,STATUS,HTARGET")
	else:
		getEYELINK().sendCommand("link_sample_data  = LEFT,RIGHT,GAZE,GAZERES,AREA,STATUS")
	
def doSetup():
	print 'Starting EyeTracker SETUP'
	if(getEYELINK().isConnected() and not getEYELINK().breakPressed()):
		getEYELINK().doTrackerSetup()
	print 'Ended EyeTracker Setup'


def closeScreen():
	pylink.closeGraphics()
	
def openEDFfile(edfFileName):
	global eyetracker, tracker_software_ver , eyelink_ver , current_edfFileName
	#Opens the EDF file.
	current_edfFileName = edfFileName
	getEYELINK().openDataFile(edfFileName)		

	# set EDF file contents 
	getEYELINK().sendCommand("file_event_filter = LEFT,RIGHT,FIXATION,SACCADE,BLINK,MESSAGE,BUTTON")
	if tracker_software_ver>=4:
		getEYELINK().sendCommand("file_sample_data  = LEFT,RIGHT,GAZE,AREA,GAZERES,STATUS,HTARGET")
	else:
		getEYELINK().sendCommand("file_sample_data  = LEFT,RIGHT,GAZE,AREA,GAZERES,STATUS")

def printToEDFfile(text):
	getEYELINK().sendMessage(str(text))

		
def closeEDFfile(destination):
	#Close the file and transfer it to Display PC
	getEYELINK().closeDataFile()
	getEYELINK().receiveDataFile(current_edfFileName, destination)

def closeEyetracker():
	global eyetracker, tracker_software_ver , eyelink_ver , current_edfFileName
	if getEYELINK() != None:
		# File transfer and cleanup!
		getEYELINK().setOfflineMode();                          
		msecDelay(500);                 

		getEYELINK().close();

def stopRecording():
	getEYELINK().stopRecording();		

def startRecording():
	error = getEYELINK().startRecording(1,1,1,1)
	return error
	
if __name__ == "__main__":
	initializeEyeTracker()
	openEDFfile("test.edf")
	prepareScreen()
	doSetup()
	
	closeEyetracker()
	#Close the experiment graphics	
	display.quit()
