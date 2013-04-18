# para comunicarse con el puerto paralelo
import ctypes
import time


class LPTPort:
    def initialize(self,LPTPortNum,lag_time,code_reset):
        self.port = LPTPortNum
        self.lag = lag_time
        self.resetcode = code_reset
        return
    
    def write(self,code):
        # Mandar el codigo...
        ctypes.windll.inpout32.Out32 (self.port, code)
        # ...esperar el lag...
        time.sleep(self.lag)
        # ...mandar el reset
        ctypes.windll.inpout32.Out32 (self.port, self.resetcode)

        return
