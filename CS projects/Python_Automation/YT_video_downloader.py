from pytube import YouTube
from sys import argv
# argv takes all of the things that you input into the command line when you run the program. 

# 1st argument is the program name argv[0]. 
# argv[1] is the first command line argmument which is used here.
link = argv[1]
yt = YouTube(link)

print("Title: ", yt.title)

print("Views: ", yt.views)

# Set preferred quality
yd = yt.streams.get_highest_resolution()

# File Path downloaded to
yd.download('/mnt/c/Users/jabba/Desktop/Downloaded Videos/YouTube Downloads')

# To run, python3 YT_download.py "youtube link"
