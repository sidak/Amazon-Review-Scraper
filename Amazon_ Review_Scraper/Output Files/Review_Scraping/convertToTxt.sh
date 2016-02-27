#!/bin/bash
ls * > FILES
for f in $FILES
do
	mv "$f" "$f".txt
done






