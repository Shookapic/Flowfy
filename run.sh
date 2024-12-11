#!/bin/bash

cd frontend/area-front
npm start &

cd ../../backend/area-back
npm start &

