# -*- coding: utf-8 -*-
import sys, time, datetime, os, locale
from socket import *
import select

def wait_for_writing(sock,send_buffer):
	potential_readers = []
	potential_writers = [sock]
	potential_errs = [sock]
	ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, 1.5)
	
	if sock in in_error:
		print 'Error connecting to freechess.org, exiting.'
		exit(0)
	
	while(ready_to_write==[]):
		ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, 1.5)
		if sock in in_error:
			print 'Error waiting to write to freechess.org, exiting.'
			exit(0)
			
	sock.send(send_buffer)
	
def read_all(sock):
	output = ''
	potential_readers = [sock]
	potential_writers = []
	potential_errs = [sock]
	ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, 1.5)
	
	if sock in in_error:
		print 'Error connecting to freechess.org, exiting.'
		exit(0)
	
	while(not (ready_to_read==[])):
		output += sock.recv(8192)
		ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, 1.5)
		if sock in in_error:
			print 'Error waiting to write to freechess.org, exiting.'
			exit(0)
	
	return output

def read_all_long(sock,seconds):
	output = ''
	potential_readers = [sock]
	potential_writers = []
	potential_errs = [sock]
	ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, seconds)
	
	if sock in in_error:
		print 'Error connecting to freechess.org, exiting.'
		exit(0)
	
	while(not (ready_to_read==[])):
		output += sock.recv(8192)
		ready_to_read, ready_to_write, in_error = select.select(potential_readers, potential_writers, potential_errs, seconds)
		if sock in in_error:
			print 'Error waiting to write to freechess.org, exiting.'
			exit(0)
	
	return output
