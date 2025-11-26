# AI Detection & Re-ID Development Guide

# Prerequisites

You must install Python3.

Recommended approach is to use a virtualenv to isolate required dependencies:

On Mac/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows (with Cuda 12.8):

```
python3 -m venv .venv
.venv\Scripts\activate.bat
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
pip install -r requirements-win32.txt
```
Alternative venv activation with powershell:
```
.\.venv\Scripts\Activate.ps1
```

To install new packages:

```
pip install xxxx
pip freeze  > requirements.txt
```

Then commit `requirements.txt`.

We use the same venv for both CPU and GPU models for simplicity.

# Deployment

The Python script and runtime is packaged with the Electron frontend by building
a Pyinstaller distribution. Build the Pyinstaller runtime using the
`build_pyinstaller.[sh|bat]` scripts.

The Python script detects whether Cuda is available, uses the GPU model if so,
otherwise falls back to the CPU model.

The Pyinstaller distribution includes the Python interpreter from the environment
that which runs the build script. So it includes a copy of the venv's Python
interpreter, plus all its pip dependencies. As such, to deploy on multiple
platforms, you need to run the build script on that platform.

Note the model PT files need to be copied into `python/models/` before the
build. Contact the project owners to get a copy of the models.

Conda is not recommended for deployment, as it has behavior differences with
Python multiprocessing; specifically, it doesn't handle shutdown signals correctly,
and so we can't cancel an in process run when running in Conda.

# Development

To run a development version inside the electron frontend, set the env var
`PYTHON_SCRIPT_PATH` to the path to the cpu or gpu main script when running
the electron process.

For the Re-ID pipeline, you can optionally pass a batch size
to `main.py` when running the `reid` task, for example:

```bash
python main.py reid <image_dir> <json_dir> <output_dir> <reid_output_dir> <log_dir> 8
```

If the optional `batch_size` argument is omitted, a default of `4` is used.

On macOS/Linux:

```bash
cd care-electron
PYTHON_SCRIPT_PATH=../python/main.py npm run dev
```

On Windows (PowerShell):

```powershell
cd care-electron
$env:PYTHON_SCRIPT_PATH = "../python/main.py"
npm run dev
```

On Windows (Command Prompt):

```bat
cd care-electron
set PYTHON_SCRIPT_PATH=../python/main.py
npm run dev
```

Unfortunately, you still need to have built the Pyinstaller server at least once
for this to work, due to the way asset loading works in Electron-Vite.

# Conda development (NOT RECOMMENDED)

You can use Conda for development, but it is NOT RECOMMENDED for deployment -
see note above about shutdown hangs.

Instructions:

```
conda create --name CARE-GPU python=3.10 -y
conda activate CARE-GPU
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
conda install -c conda-forge opencv yacs -y
pip install ultralytics
conda deactivate
```
