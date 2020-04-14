#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { PhotoGalleryCdkStack } from '../lib/photo-gallery-cdk-stack';

const app = new cdk.App();
new PhotoGalleryCdkStack(app, 'PhotoGalleryCdkStack');
