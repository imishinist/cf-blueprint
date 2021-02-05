#!/usr/bin/env python
# -*- coding: utf-8 -*-

import boto3
import json
import _jsonnet
import fire

import os.path


class CFnDeploy(object):
    def __load_jsonnet(self, params_path):
        with open(params_path) as f:
            jsonnet_str = f.read()

        json_str = _jsonnet.evaluate_snippet(
            "snippet", jsonnet_str)

        return json.loads(json_str)

    def __load_json(self, params_path):
        with open(params_path) as f:
            return json.load(f)

    def __load_cfn_params(self, params_path):
        ext = os.path.splitext(params_path)[1]
        if ext == ".jsonnet":
            params = self.__load_jsonnet(params_path)
        else:
            params = self.__load_json(params_path)

        cfn_params = []
        for key in params:
            cfn_params.append(
                {
                    'ParameterKey': str(key),
                    'ParameterValue': str(params[key]),
                    'UsePreviousValue': False,
                }
            )
        return cfn_params

    def deploy(self, stack, template_path, params_path):
        client = boto3.client('cloudformation')
        with open(template_path) as f:
            s = f.read()

        params = self.__load_cfn_params(params_path)

        response = client.create_stack(
            StackName=stack,
            TemplateBody=s,
            Parameters=params,
            Capabilities=['CAPABILITY_IAM', 'CAPABILITY_AUTO_EXPAND'])
        print(response)


if __name__ == '__main__':
    fire.Fire(CFnDeploy)
