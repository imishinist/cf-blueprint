#!/usr/bin/env python
# -*- coding: utf-8 -*-

import boto3
import json
import fire

class CFnDeploy(object):
    def deploy(self, stack, template_path, params_path):        
        client = boto3.client('cloudformation')
        with open(template_path) as f:
            s = f.read()

        with open(params_path) as f:
            params = json.load(f)

        cfn_params = []
        for key in params:
            cfn_params.append(
                {
                    'ParameterKey': str(key),
                    'ParameterValue': str(params[key]),
                    'UsePreviousValue': False,
                }
            )

        response = client.create_stack(
            StackName=stack,
            TemplateBody=s,
            Parameters=cfn_params,
            Capabilities=['CAPABILITY_IAM', 'CAPABILITY_AUTO_EXPAND'])
        print(response)

if __name__ == '__main__':
    fire.Fire(CFnDeploy)
