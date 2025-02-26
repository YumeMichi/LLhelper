import os
import os.path
import json
import threading
import sys
import ctypes
from lib.SyncPrinter import SyncPrinter
from lib.JsonUtil import JsonFile

if sys.version[0] == '2':
    from urllib2 import urlopen
    import Queue
else:
    from urllib.request import urlopen
    import queue as Queue

LLSIF_WIN_API_DOMAIN = 'http://localhost:8081/'
# LLSIF_WIN_API_ENDPOINT = 'live/json/'
LIVE_MAP_LOCAL_CACHE_DIR = 'static/live/json/'

NOTE_TYPE_RANDOM = 0
NOTE_TYPE_NORMAL = 1
NOTE_TYPE_EVENT = 2
NOTE_TYPE_HOLD = 3
NOTE_TYPE_BOMB_1 = 4
NOTE_TYPE_BOMB_3 = 5
NOTE_TYPE_BOMB_5 = 6
NOTE_TYPE_BOMB_9 = 7
NOTE_TYPE_SWING = 11
NOTE_TYPE_SWING_EVENT = 12
NOTE_TYPE_SWING_HOLD = 13

NOTE_WEIGHT_BASE = 1.0
NOTE_WEIGHT_HOLD_FACTOR = 1.25
NOTE_WEIGHT_SWING_FACTOR = 0.5

STATUS_SKIPPED = 0
STATUS_SUCCESSFUL = 1
STATUS_ERROR = 2
STATUS_KEYBOARD_INTERRUPT = 3
STATUS_EXIT = 4

NUMBER_OF_THREAD = 20

FILENAME_SONG_LIST_JSON = 'newsongsjson.txt'

liveDataKeysForNumber = ['time', 'star', 'slider', 'swing', 'swingslider']
liveDataKeysForPositiveNumber = ['time']
liveDataKeysForPosition = ['positionweight', 'positionnote', 'positionslider', 'positionswing', 'positionswingslider']

TITLE_WELCOME = '''# Welcome to LLHelper LLSIF Song Updater!

* Song data based on `%s`.
* Song data cached at `%s`.
* Program originally authored by **Chazeon** and the end of Sept 2017 in NY.
* Updated by **ben1222** at 2018 Dec

* We are now updating song list file: `%s`.
''' % (LLSIF_WIN_API_DOMAIN, LIVE_MAP_LOCAL_CACHE_DIR, FILENAME_SONG_LIST_JSON)

class Note:
    def __init__(self, noteDict):
        self.level = noteDict['notes_level']
        self.type = noteDict['effect']
        self.position = noteDict['position']
        self.attribute = noteDict['notes_attribute']
        self.appearTime = noteDict['timing_sec']
        self.effectValue = noteDict['effect_value']
    def isHold(self):
        return self.type in [NOTE_TYPE_HOLD, NOTE_TYPE_SWING_HOLD]
    def isSwing(self):
        return self.type in [NOTE_TYPE_SWING, NOTE_TYPE_SWING_EVENT, NOTE_TYPE_SWING_HOLD]
    def isStar(self):
        return self.type in [NOTE_TYPE_BOMB_1, NOTE_TYPE_BOMB_3, NOTE_TYPE_BOMB_5, NOTE_TYPE_BOMB_9]
    def getNoteWeightedValue(self):
        weightValue = NOTE_WEIGHT_BASE
        if self.isSwing():
            weightValue *= NOTE_WEIGHT_SWING_FACTOR
        if self.isHold():
            weightValue *= NOTE_WEIGHT_HOLD_FACTOR
        return weightValue
    def getEndTime(self):
        if self.isHold():
            return float(self.appearTime) + float(self.effectValue)
        else:
            return float(self.appearTime)

class LiveMap:
    def __init__(self, mapData):
        self.mapData = mapData
        positionWeight = [0.0] * 9
        positionNote = [0] * 9
        positionSlider = [0] * 9
        positionSwing = [0] * 9
        positionSwingSlider = [0] * 9
        starCount = 0
        sliderCount = 0
        swingCount = 0
        swingSliderCount = 0
        endTime = 0.0
        for note in mapData:
            note = Note(note)
            position = 9 - note.position
            positionWeight[position] += note.getNoteWeightedValue()
            if note.isHold():
                if note.isSwing():
                    positionSwingSlider[position] += 1
                    swingSliderCount += 1
                else:
                    positionSlider[position] += 1
                    sliderCount += 1
            elif note.isSwing():
                positionSwing[position] += 1
                swingCount += 1
            else:
                positionNote[position] += 1
            if note.isStar():
                starCount += 1
            curEndTime = note.getEndTime()
            if curEndTime > endTime:
                endTime = curEndTime
        self.positionWeight = positionWeight
        self.positionNote = positionNote
        self.positionSlider = positionSlider
        self.positionSwing = positionSwing
        self.positionSwingSlider = positionSwingSlider
        self.starCount = starCount
        self.sliderCount = sliderCount
        self.swingCount = swingCount
        self.swingSliderCount = swingSliderCount
        self.endTime = endTime
    def updateLiveData(self, liveData):
        liveData['positionweight'] = list(map(str, self.positionWeight))
        liveData['positionnote'] = list(map(str, self.positionNote))
        liveData['positionslider'] = list(map(str, self.positionSlider))
        liveData['positionswing'] = list(map(str, self.positionSwing))
        liveData['positionswingslider'] = list(map(str, self.positionSwingSlider))
        liveData['star'] = str(self.starCount)
        liveData['slider'] = str(self.sliderCount)
        liveData['swing'] = str(self.swingCount)
        liveData['swingslider'] = str(self.swingSliderCount)
        liveData['time'] = str(self.endTime)

def getLiveMapJsonUrl(liveId, liveJs):
    # if liveId > 1884:
    #     raise Exception('llsif no longer updating new live maps')
    # else:
        # return LLSIF_WIN_API_DOMAIN + LLSIF_WIN_API_ENDPOINT + str(liveId)
        return LLSIF_WIN_API_DOMAIN + liveJs
def getLiveMapJsonPath(liveJs):
    return LIVE_MAP_LOCAL_CACHE_DIR + liveJs

def getLiveMap(liveId, liveJs):
    liveJsonPath = getLiveMapJsonPath(liveJs)
    if os.path.isfile(liveJsonPath):
        with open(liveJsonPath, 'r') as f:
            liveJson = json.load(f)
    else:
        liveJsonUrl = getLiveMapJsonUrl(liveId, liveJs)
        # timeout for 10 seconds
        liveJsonFp = urlopen(liveJsonUrl, None, 10)
        liveJson = json.load(liveJsonFp)
        with open(liveJsonPath, 'w') as f:
            json.dump(liveJson, f, sort_keys=True)
    return LiveMap(liveJson)

def isLiveDataComplete(live):
    for positionKey in liveDataKeysForPosition:
        if positionKey not in live:
            return False
        positionValue = live[positionKey]
        if len(positionValue) != 9:
            return False
        if len(str(positionValue[0])) == 0:
            return False
    for numberKey in liveDataKeysForNumber:
        if numberKey not in live:
            return False
        numberValue = live[numberKey]
        if len(str(numberValue)) == 0:
            return False
        if float(numberValue) <= 0 and (numberKey in liveDataKeysForPositiveNumber):
            return False
    return True

class positionWeightUpdateThread (threading.Thread):
    def __init__(self, liveQueue, messageQueue, printer):
        threading.Thread.__init__(self)
        self.liveQueue = liveQueue
        self.messageQueue = messageQueue
        self.printer = printer
    def run(self):
        while True:
            try:
                live = self.liveQueue.get(False)
                self.messageQueue.put(self.processLive(live))
            except Queue.Empty:
                self.printer.myPrint('* Queue is empty, exiting... *')
                break
            except Exception as e:
                self.printer.myPrint('* Unknown exception *')
                self.printer.myPrint(e)
                break
    def processLive(self, live):
        liveId = int(live['liveid'])
        liveJs = live['jsonpath']
        try:
            result = getLiveMap(liveId, liveJs)
            self.printer.myPrint('* Successfully processed %d' % (liveId))
            return (liveId, STATUS_SUCCESSFUL, result)
        except KeyboardInterrupt:
            self.printer.myPrint('* User trying to exit program')
            return (liveId, STATUS_KEYBOARD_INTERRUPT, None)
        except Exception as e:
            self.printer.myPrint('* Failed to process %d, json=%s' % (liveId, live['jsonpath']))
            self.printer.myPrint(e)
            return (liveId, STATUS_ERROR, None)
    def interrupt(self, e):
        if not self.isAlive():
            return
        ex = ctypes.py_object(e)
        ret = ctypes.pythonapi.PyThreadState_SetAsyncExc(ctypes.c_long(self.ident), ex)
        if ret == 0:
            self.printer.myPrint('thread already exit')
        elif ret > 1:
            self.printer.myPrint('Failed to interrupt thread')


def main(threadCount):
    songs = {}
    prevLoadedLives = []
    updatedLives = []

    messageQueue = Queue.Queue()
    liveQueue = Queue.Queue()
    liveQueueCount = 0
    totalLiveCount = 0
    threads = []

    lives = {}
    printer = SyncPrinter()

    jsonFile = JsonFile(FILENAME_SONG_LIST_JSON, printer)
    songs = jsonFile.load()

    if not os.path.isdir(LIVE_MAP_LOCAL_CACHE_DIR):
        os.makedirs(LIVE_MAP_LOCAL_CACHE_DIR)

    for song in songs.values():
        for liveSettingId in song['settings'].keys():
            totalLiveCount += 1
            live = song['settings'][liveSettingId]
            liveId = int(live['liveid'])
            if not isLiveDataComplete(live):
                liveQueue.put(live)
                lives[live['liveid']] = live
                liveQueueCount += 1

    # do not create more thread than number of lives to update
    if threadCount > liveQueueCount:
        threadCount = liveQueueCount
    if threadCount <= 1:
        printer.myPrint('* Single thread mode, processing %d lives' % liveQueueCount)
        while not liveQueue.empty():
            live = liveQueue.get()
            liveId = int(live['liveid'])
            liveJs = live['jsonpath']
            try:
                liveMap = getLiveMap(liveId, liveJs)
                liveMap.updateLiveData(live)
                updatedLives.append(liveId)
                printer.myPrint('* Successfully processed %d' % (liveId))
            except KeyboardInterrupt:
                printer.myPrint('* User trying to exit program')
            except Exception as e:
                printer.myPrint('* Failed to process %d, json=%s' % (liveId, live['jsonpath']))
                printer.myPrint(e)
    else:
        printer.myPrint('* Multi-thread mode, %d threads processing %d lives' % (threadCount, liveQueueCount))
        try:
            for i in range(threadCount):
                newThread = positionWeightUpdateThread(liveQueue, messageQueue, printer)
                newThread.start()
                threads.append(newThread)
            for i in range(liveQueueCount):
                liveId, status, result = messageQueue.get()
                if status == STATUS_SUCCESSFUL:
                    updatedLives.append(liveId)
                    result.updateLiveData(lives[str(liveId)])

        except KeyboardInterrupt:
            try:
                while True:
                    liveQueue.get(False)
            except Queue.Empty:
                printer.myPrint('* Cleared queue *')
            for curThread in threads:
                curThread.interrupt(KeyboardInterrupt)

    jsonFile.save(songs)
    printer.myPrint('* Successfully processed lives: `%s`.' % (str(updatedLives)))
    printer.myPrint('* Updated %s , live count = %d (old: %d, new: %d).' % (FILENAME_SONG_LIST_JSON, totalLiveCount, (totalLiveCount - liveQueueCount), len(updatedLives)))

    for curThread in threads:
        curThread.join()

if __name__ == '__main__':
    print(TITLE_WELCOME)
    threadCount = NUMBER_OF_THREAD
    if len(sys.argv) > 1:
        threadCount = int(sys.argv[1])
    main(threadCount)

