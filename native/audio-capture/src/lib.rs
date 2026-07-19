use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleFormat,
    Stream,
};

use napi::{Error, Result};
use std::sync::{Arc, Mutex};
use napi_derive::napi;

use std::sync::atomic::{AtomicUsize, Ordering};

use napi::{
    bindgen_prelude::*,
    threadsafe_function::{
        ThreadSafeCallContext,
        ThreadsafeFunction,
        ThreadsafeFunctionCallMode,
    },
};

static SAMPLE_COUNTER: AtomicUsize = AtomicUsize::new(0);

#[napi]
pub struct AudioCapture {
    stream: Option<Stream>,
    sample_rate: u32,
    channels: u16,

    audio_callback: Arc<Mutex<Option<ThreadsafeFunction<Vec<u8>>>>>,
}

impl AudioCapture {
    fn emit_pcm(
        callback: &Arc<Mutex<Option<ThreadsafeFunction<Vec<u8>>>>>,
        pcm: &[f32],
    ) {
        let tsfn = {
            let guard = callback.lock().unwrap();
            guard.as_ref().cloned()
        };

        if let Some(tsfn) = tsfn {

            let mut bytes = Vec::<u8>::with_capacity(pcm.len() * 4);

            for sample in pcm {
                bytes.extend_from_slice(&sample.to_le_bytes());
            }

            let _ = tsfn.call(
                Ok(bytes),
                ThreadsafeFunctionCallMode::NonBlocking,
            );
        }
    }

    fn create_stream(
        &self,
        device: &cpal::Device,
        config: &cpal::SupportedStreamConfig,
    ) -> Result<Stream> {
        
        match config.sample_format() {
            
            SampleFormat::F32 => {
                let callback = self.audio_callback.clone();
        
                let stream = device
                    .build_input_stream(
                        &config.clone().into(),
                        move |data: &[f32], _| {
                            // println!("Received {} f32 samples", data.len());
                            
                            let count = SAMPLE_COUNTER.fetch_add(1, Ordering::Relaxed);

                            if count % 50 == 0 {
                                println!("Audio running... {} samples", data.len());
                            }

                            // Later:
                            // Milestone 2:
                            // emit_pcm(data)
                           Self::emit_pcm(&callback, data);

                        },
                        move |err| {
                            eprintln!("Audio error: {:?}", err);
                        },
                        None,
                    )
                    .map_err(|e| Error::from_reason(e.to_string()))?;

                Ok(stream)
            }

            SampleFormat::I16 => {
                let callback = self.audio_callback.clone();

                let stream = device
                    .build_input_stream(
                        &config.clone().into(),
                        move |data: &[i16], _| {
                            let pcm: Vec<f32> = data
                                .iter()
                                .map(|s| *s as f32 / i16::MAX as f32)
                                .collect();

                            // println!("Received {} i16 samples", pcm.len());

                            // Later:
                            // emit_pcm(&pcm)
                            Self::emit_pcm(&callback, &pcm);

                        },
                        move |err| {
                            eprintln!("Audio error: {:?}", err);
                        },
                        None,
                    )
                    .map_err(|e| Error::from_reason(e.to_string()))?;

                Ok(stream)
            }

            SampleFormat::U16 => {
                let callback = self.audio_callback.clone();

                let stream = device
                    .build_input_stream(
                        &config.clone().into(),
                        move |data: &[u16], _| {
                            let pcm: Vec<f32> = data
                                .iter()
                                .map(|s| (*s as f32 / u16::MAX as f32) * 2.0 - 1.0)
                                .collect();

                            // println!("Received {} u16 samples", pcm.len());

                            // Later:
                            // emit_pcm(&pcm)
                            Self::emit_pcm(&callback, &pcm);

                        },
                        move |err| {
                            eprintln!("Audio error: {:?}", err);
                        },
                        None,
                    )
                    .map_err(|e| Error::from_reason(e.to_string()))?;

                Ok(stream)
            }

            _ => Err(Error::from_reason("Unsupported sample format")),
        }
    }
}

#[napi]
impl AudioCapture {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            stream: None,
            sample_rate: 0,
            channels: 0,
            audio_callback: Arc::new(Mutex::new(None)),
        }
    }

    #[napi]
    pub fn start(&mut self) -> Result<()> {
        if self.stream.is_some() {
            println!("Already recording.");
            return Ok(());
        }

        let host = cpal::default_host();

        let device = host
            .default_input_device()
            .ok_or_else(|| Error::from_reason("No microphone found"))?;

        println!("Using microphone: {}", device.name().unwrap());

        let config = device
            .default_input_config()
            .map_err(|e| Error::from_reason(e.to_string()))?;

        self.sample_rate = config.sample_rate().0;
        self.channels = config.channels();

        println!("Sample Rate: {}", self.sample_rate);
        println!("Channels: {}", self.channels);

        let stream = self.create_stream(&device, &config)?;

        stream
            .play()
            .map_err(|e| Error::from_reason(e.to_string()))?;

        self.stream = Some(stream);

        println!("Recording started.");

        Ok(())
    }

    #[napi]
    pub fn stop(&mut self) {
        self.stream = None;

        println!("Recording stopped.");
    }

    #[napi]
    pub fn is_recording(&self) -> bool {
        self.stream.is_some()
    }

    #[napi]
    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    #[napi]
    pub fn channels(&self) -> u16 {
        self.channels
    }

    #[napi]
    pub fn dispose(&mut self) {
        self.stream = None;

        *self.audio_callback.lock().unwrap() = None;

        self.sample_rate = 0;
        self.channels = 0;

        println!("AudioCapture disposed.");
    }

    #[napi]
    pub fn on_audio_data(
        &mut self,
        callback: JsFunction,
    ) -> Result<()> {
        let tsfn = callback.create_threadsafe_function(
            0,
            |ctx: ThreadSafeCallContext<Vec<u8>>| {
                Ok(vec![ctx.value])
            },
        )?;

        *self.audio_callback.lock().unwrap() = Some(tsfn);

        println!("Audio callback registered.");

        Ok(())
    }
}