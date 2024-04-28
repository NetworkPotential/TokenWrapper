#!.venv/bin/python
import os
import sys
from argparse import ArgumentParser
import solcx
from web3 import Web3


def get_command():
    called_name = os.path.basename(sys.argv[0])
    if( called_name == 'manage.py'):
        return sys.argv[1]
    else:
        return called_name

setting_map = {
    'deploy': [
        "TOKEN_CONTRACT_SOURCE",
        "TOKEN_CONTRACT_OWNER_ADDR",
        "TOKEN_CONTRACT_OWNER_SECRET"
    ]
}

def get_settings(command_name):
    required_settings = setting_map[command_name]
    settings = {}
    for var in required_settings:
        if(os.environ.get(var) is not None):
            settings[var] = os.environ.get(var)
            print(os.environ.get(var))
        else:
            settings[var] = input(f"Please enter setting for {var}:")
    return settings


print(solcx.install_solc(version='latest'))
version = solcx.get_installed_solc_versions()[0]
command = get_command()
settings = get_settings(command)

with open(settings["TOKEN_CONTRACT_SOURCE"]) as f:
    contract_source = f.read()

compiled = solcx.compile_source(contract_source,
                                output_values=['abi', 'bin'],
                                solc_version=version,
                                import_remappings={"@openzeppelin" : "../openzeppelin-contracts"}
                                )
print(compiled['<stdin>:TokenWrapper'])
